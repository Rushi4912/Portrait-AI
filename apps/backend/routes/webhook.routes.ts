import { prismaClient } from "db";
import { Router } from "express";
import { Webhook } from "svix";

export const router = Router();

router.post("/clerk", async (req, res) => {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  const payload = req.body;

  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({
      success: false,
      message: "Error: Missing svix headers",
    });
    return;
  }

  let evt: any;

  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id as string,
      "svix-timestamp": svix_timestamp as string,
      "svix-signature": svix_signature as string,
    });
  } catch (err) {
    console.log("Error: Could not verify webhook:", (err as Error).message);
    res.status(400).json({
      success: false,
      message: (err as Error).message,
    });
    return;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        // Update user record
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

        // ADD THIS: Create/update UserCredit record
        await prismaClient.userCredit.upsert({
          where: { userId: id },
          create: {
            userId: id,
            amount: 20, // Default credits for new users
          },
          update: {} // Don't update credits on existing users
        });
        break;
      }

      case "user.deleted": {
        // Delete credit record first
        await prismaClient.userCredit.deleteMany({
          where: { userId: id },
        });
        
        // Then delete user
        await prismaClient.user.delete({
          where: { clerkId: id },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
        break;
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }

  res.status(200).json({ success: true, message: "Webhook received" });
});