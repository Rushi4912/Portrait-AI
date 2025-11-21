import { Router } from "express";
import { Webhook } from "svix";
import { prismaClient } from "../lib/prisma";
import { webhookLimiter } from "../middleware/rateLimiter";
import { StoryCompletionService } from "../services/story-completion.service";

const router = Router();
const storyCompletion = StoryCompletionService.getInstance();

router.post("/clerk", webhookLimiter, async (req, res) => {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    res
      .status(500)
      .json({ success: false, message: "SIGNING_SECRET not configured" });
    return;
  }

  const wh = new Webhook(SIGNING_SECRET);
  const payload = req.body;

  const svixId = req.headers["svix-id"] as string | undefined;
  const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
  const svixSignature = req.headers["svix-signature"] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ success: false, message: "Missing svix headers" });
    return;
  }

  let evt: any;
  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Invalid signature",
    });
    return;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      await prismaClient.user.upsert({
        where: { clerkId: id },
        update: {
          name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
          email: evt.data.email_addresses[0].email_address,
          profilePicture: evt.data.profile_image_url,
        },
        create: {
          clerkId: id,
          name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
          email: evt.data.email_addresses[0].email_address,
          profilePicture: evt.data.profile_image_url,
        },
      });

      await prismaClient.userCredit.upsert({
        where: { userId: id },
        update: {},
        create: {
          userId: id,
          amount: 20,
        },
      });
    }

    if (eventType === "user.deleted") {
      await prismaClient.userCredit.deleteMany({ where: { userId: id } });
      await prismaClient.user.delete({ where: { clerkId: id } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }

  res.json({ success: true });
});

router.post("/story/page", webhookLimiter, async (req, res) => {
  const requestId = req.body.request_id as string | undefined;
  const status = req.body.status;

  if (!requestId) {
    res.status(400).json({ message: "Missing request_id" });
    return;
  }

  try {
    if (status === "ERROR") {
      await prismaClient.storyPage.updateMany({
        where: { falAiRequestId: requestId },
        data: { status: "Failed" },
      });
      res.json({ message: "Error recorded" });
      return;
    }

    if (status === "COMPLETED" || status === "OK") {
      const imageUrl = req.body.payload?.images?.[0]?.url;

      await prismaClient.storyPage.updateMany({
        where: { falAiRequestId: requestId },
        data: {
          imageUrl: imageUrl ?? "",
          status: imageUrl ? "Generated" : "Failed",
        },
      });

      const storyPage = await prismaClient.storyPage.findFirst({
        where: { falAiRequestId: requestId },
      });

      if (storyPage) {
        await storyCompletion.checkStoryCompletion(storyPage.storyId);
      }
    }

    res.json({ message: "Webhook processed" });
  } catch (error) {
    res.status(500).json({ message: "Internal error" });
  }
});

export const webhookRouter = router;

