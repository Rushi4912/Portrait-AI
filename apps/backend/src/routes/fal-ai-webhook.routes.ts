import { Router } from "express";
import { fal } from "@fal-ai/client";
import { prismaClient } from "../lib/prisma";
import { FalAIModel } from "../models/fal-ai.model";
import { webhookLimiter } from "../middleware/rateLimiter";

const router = Router();
const falAiModel = new FalAIModel();
const TRAIN_MODEL_CREDITS = 20;

router.use(webhookLimiter);

router.post("/train", async (req, res) => {
  const requestId = req.body.request_id as string | undefined;
  if (!requestId) {
    res.status(400).json({ message: "Missing request_id" });
    return;
  }

  const model = await prismaClient.model.findFirst({
    where: { falAiRequestId: requestId },
  });

  if (!model) {
    res.status(404).json({ message: "Model not found" });
    return;
  }

  if (req.body.status === "ERROR") {
    await prismaClient.model.updateMany({
      where: { falAiRequestId: requestId },
      data: { trainingStatus: "Failed" },
    });
    res.json({ message: "Error recorded" });
    return;
  }

  if (req.body.status !== "COMPLETED" && req.body.status !== "OK") {
    res.json({ message: "Status pending" });
    return;
  }

  try {
    let loraUrl =
      req.body.payload?.diffusers_lora_file?.url ?? null;

    if (!loraUrl) {
      const result = await fal.queue.result("fal-ai/flux-lora-fast-training", {
        requestId,
      });
      loraUrl = (result.data as any).diffusers_lora_file.url;
    }

    const credits = await prismaClient.userCredit.findUnique({
      where: { userId: model.userId },
    });

    if ((credits?.amount ?? 0) < TRAIN_MODEL_CREDITS) {
      res.status(402).json({ message: "Not enough credits" });
      return;
    }

    const previewImage = loraUrl ? await falAiModel.generateImageSync(loraUrl) : "";

    await prismaClient.model.updateMany({
      where: { falAiRequestId: requestId },
      data: {
        trainingStatus: "Generated",
        tensorPath: loraUrl ?? undefined,
        thumbnail: previewImage,
      },
    });

    await prismaClient.userCredit.update({
      where: { userId: model.userId },
      data: { amount: { decrement: TRAIN_MODEL_CREDITS } },
    });

    res.json({ message: "Model updated" });
  } catch (error) {
    await prismaClient.model.updateMany({
      where: { falAiRequestId: requestId },
      data: { trainingStatus: "Failed" },
    });
    res.status(500).json({ message: "Failed to process webhook" });
  }
});

router.post("/image", async (req, res) => {
  const requestId = req.body.request_id as string | undefined;
  if (!requestId) {
    res.status(400).json({ message: "Missing request_id" });
    return;
  }

  if (req.body.status === "ERROR") {
    await prismaClient.outputImages.updateMany({
      where: { falAiRequestId: requestId },
      data: { status: "Failed" },
    });
    res.json({ message: "Error recorded" });
    return;
  }

  const imageUrl = req.body.payload?.images?.[0]?.url;

  await prismaClient.outputImages.updateMany({
    where: { falAiRequestId: requestId },
    data: {
      status: imageUrl ? "Generated" : "Failed",
      imageUrl: imageUrl ?? "",
    },
  });

  res.json({ message: "Webhook received" });
});

export const falAiWebhookRouter = router;

