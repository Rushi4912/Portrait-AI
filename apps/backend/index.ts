import { fal } from "@fal-ai/client";
import express from "express";
import {
  TrainModel,
  GenerateImage,
  GenerateImagesFromPack,
} from "common/types";
import { prismaClient } from "../../packages/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FalAIModel } from "./models/FalAIModel";
import cors from "cors";
import { authMiddleware } from "./middleware";
import dotenv from "dotenv";
dotenv.config();

import paymentRoutes from "../backend/routes/payment.routes";
import { router as webhookRouter } from "./routes/webhook.routes";

const IMAGE_GEN_CREDITS = 1;
const TRAIN_MODEL_CREDITS = 20;


const PORT = process.env.PORT || 8080;

const falAiModel = new FalAIModel();

const app = express();
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
// interface AuthenticatedRequest extends Request {
//   userId?: string;
// }
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/pre-signed-url", async (req, res) => {
  const key = `models/${Date.now()}_${Math.random()}.zip`;
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    endpoint: process.env.ENDPOINT, // optional, only if using custom endpoint
    forcePathStyle: !!process.env.ENDPOINT, // needed for some S3-compatible storage
  });

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: key,
    ContentType: "application/zip",
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  res.json({ url, key });
});

app.post("/ai/training", authMiddleware, async (req, res) => {
  try {
    const parsedBody = TrainModel.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(411).json({
        message: "Input incorrect",
        error: parsedBody.error,
      });
      return;
    }

    const { request_id, response_url } = await falAiModel.trainModel(
      parsedBody.data.zipUrl,
      parsedBody.data.name
    );

    const data = await prismaClient.model.create({
      data: {
        name: parsedBody.data.name,
        type: parsedBody.data.type,
        age: parsedBody.data.age,
        ethinicity: parsedBody.data.ethinicity,
        eyeColor: parsedBody.data.eyeColor,
        bald: parsedBody.data.bald,
        userId: req.userId!,
        zipUrl: parsedBody.data.zipUrl,
        falAiRequestId: request_id,
      },
    });

    res.json({
      modelId: data.id,
    });
  } catch (error) {
    console.error("Error in /ai/training:", error);
    res.status(500).json({
      message: "Training failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
// src/routes/balance.ts
  try {
    // TEMPORARY: Hardcoded user ID for testing
    const testUserId = "user_2xokzIuNpd7YfnFmbsfBxlXmdxn"; // Your Clerk user ID
   
    // Use either authenticated user or test user
    const userId = process.env.NODE_ENV === "development"
      ? testUserId
      : req.userId;

    const creditRecord = await prismaClient.userCredit.findUnique({
      where: { userId }
    });

    // Create record if missing (for testing)
    if (!creditRecord && process.env.NODE_ENV === "development") {
      await prismaClient.userCredit.create({
        data: {
          userId: testUserId,
          amount: 1000 // Test credit amount
        }
      });
    }

    res.status(200).json({ credits: creditRecord?.amount || 0 });
  } catch (error) {
    console.error("Credit balance error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : 




app.post("/ai/generate", authMiddleware, async (req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(411).json({});
    return;
  }

  const model = await prismaClient.model.findUnique({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model || !model.tensorPath) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  // REMOVED: Credit check block

  const { request_id } = await falAiModel.generateImage(
    parsedBody.data.prompt,
    model.tensorPath
  );

  const data = await prismaClient.outputImages.create({
    data: {
      prompt: parsedBody.data.prompt,
      userId: req.userId!,
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: request_id,
    },
  });

  // REMOVED: Credit deduction block

  res.json({
    imageId: data.id,
  });
});
// app.post("/ai/generate-test", async (req, res) => {
//   try {
//     const { prompt } = req.body;
    
//     if (!prompt || typeof prompt !== "string") {
//       return res.status(400).json({ error: "Prompt is required" });
//     }

//     const result = await fal.subscribe("fal-ai/flux-lora", {
//       input: {
//         prompt: prompt,
//       },
//       logs: true,
//       onQueueUpdate: (update) => {
//         if (update.status === "IN_PROGRESS") {
//           update.logs.map((log) => log.message).forEach(console.log);
//         }
//       },
//     });

//     // Get the first image URL from the response
//     const imageUrl = result.data?.images?.[0]?.url;
    
//     if (!imageUrl) {
//       throw new Error("No image URL in response");
//     }

//     // Return the image URL to the frontend
//     res.json({ imageUrl });

//   } catch (error) {
//     console.error("Test generation error:", error);
//     res.status(500).json({ 
//       error: "Test generation failed",
//       message: error instanceof Error ? error.message : "Unknown error"
//     });
//   }
// });
app.post("/pack/generate", authMiddleware, async (req, res) => {
  const parsedBody = GenerateImagesFromPack.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(411).json({
      message: "Input incorrect",
    });
    return;
  }

  const prompts = await prismaClient.packPrompts.findMany({
    where: {
      packId: parsedBody.data.packId,
    },
  });

  const model = await prismaClient.model.findFirst({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  // check if the user has enough credits
  const credits = await prismaClient.userCredit.findUnique({
    where: {
      userId: req.userId!,
    },
  });

  if ((credits?.amount ?? 0) < IMAGE_GEN_CREDITS * prompts.length) {
    res.status(411).json({
      message: "Not enough credits",
    });
    return;
  }

  let requestIds: { request_id: string }[] = await Promise.all(
    prompts.map((prompt) =>
      falAiModel.generateImage(prompt.prompt, model.tensorPath!)
    )
  );

  const images = await prismaClient.outputImages.createManyAndReturn({
    data: prompts.map((prompt, index) => ({
      prompt: prompt.prompt,
      userId: req.userId!,
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: requestIds[index].request_id,
    })),
  });

  await prismaClient.userCredit.update({
    where: {
      userId: req.userId!,
    },
    data: {
      amount: { decrement: IMAGE_GEN_CREDITS * prompts.length },
    },
  });

  res.json({
    images: images.map((image) => image.id),
  });
});

app.get("/pack/bulk", async (req, res) => {
  const packs = await prismaClient.packs.findMany({});

  res.json({
    packs,
  });
});

app.get("/image/bulk", authMiddleware, async (req, res) => {
  const ids = req.query.ids as string[];
  const limit = (req.query.limit as string) ?? "100";
  const offset = (req.query.offset as string) ?? "0";

  const imagesData = await prismaClient.outputImages.findMany({
    where: {
      id: { in: ids },
      userId: req.userId!,
      status: {
        not: "Failed",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: parseInt(offset),
    take: parseInt(limit),
  });

  res.json({
    images: imagesData,
  });
});

app.get("/models",  async (req, res) => {

  try{
    console.log("from try block :");
    const models = await prismaClient.model.findMany({
      where: {
        OR: [{ userId: req.userId }, { open: true }],
      },
    });
    res.json({
      models,
    });
  }catch(error:any){

    console.error("error in models");
    res.status(500).json({ 
      message: "Failed to fetch models",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

});

// In your payment routes file


app.post("/fal-ai/webhook/train", async (req, res) => {
  console.log("====================Received training webhook====================");
  console.log("Received training webhook:", req.body);
  const requestId = req.body.request_id as string;

  // First find the model to get the userId
  const model = await prismaClient.model.findFirst({
    where: {
      falAiRequestId: requestId,
    },
  });

  console.log("Found model:", model);

  if (!model) {
    console.error("No model found for requestId:", requestId);
    res.status(404).json({ message: "Model not found" });
    return;
  }

  // Handle error case
  if (req.body.status === "ERROR") {
    console.error("Training error:", req.body.error);
    await prismaClient.model.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        trainingStatus: "Failed",
      },
    });
    
    res.json({
      message: "Error recorded",
    });
    return;
  }

 
  if (req.body.status === "COMPLETED" || req.body.status === "OK") {
    try {
      // Check if we have payload data directly in the webhook
      let loraUrl;
      if (req.body.payload && req.body.payload.diffusers_lora_file && req.body.payload.diffusers_lora_file.url) {
        // Extract directly from webhook payload
        loraUrl = req.body.payload.diffusers_lora_file.url;
        console.log("Using lora URL from webhook payload:", loraUrl);
      } else {
        // Fetch result from fal.ai if not in payload
        console.log("Fetching result from fal.ai");
        const result = await fal.queue.result("fal-ai/flux-lora-fast-training", {
          requestId,
        });
        console.log("Fal.ai result:", result);
        const resultData = result.data as any;
        loraUrl = resultData.diffusers_lora_file.url;
      }

      // check if the user has enough credits
      const credits = await prismaClient.userCredit.findUnique({
        where: {
          userId: model.userId,
        },
      });

      console.log("User credits:", credits);

      if ((credits?.amount ?? 0) < TRAIN_MODEL_CREDITS) {
        console.error("Not enough credits for user:", model.userId);
        res.status(411).json({
          message: "Not enough credits",
        });
        return;
      }

      console.log("Generating preview image with lora URL:", loraUrl);
      const { imageUrl } = await falAiModel.generateImageSync(loraUrl);

      console.log("Generated preview image:", imageUrl);

      await prismaClient.model.updateMany({
        where: {
          falAiRequestId: requestId,
        },
        data: {
          trainingStatus: "Generated",
          tensorPath: loraUrl,
          thumbnail: imageUrl,
        },
      });

      await prismaClient.userCredit.update({
        where: {
          userId: model.userId,
        },
        data: {
          amount: { decrement: TRAIN_MODEL_CREDITS },
        },
      });

      console.log("Updated model and decremented credits for user:", model.userId);
    } catch (error) {
      console.error("Error processing webhook:", error);
      await prismaClient.model.updateMany({
        where: {
          falAiRequestId: requestId,
        },
        data: {
          trainingStatus: "Failed",
        },
      });
    }
  } else {
    // For any other status, keep it as Pending
    console.log("Updating model status to: Pending");
    await prismaClient.model.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        trainingStatus: "Pending",
      },
    });
  }

  res.json({
    message: "Webhook processed successfully",
  });
});

app.post("/fal-ai/webhook/image", async (req, res) => {
  console.log("fal-ai/webhook/image");
  console.log(req.body);
  // update the status of the image in the DB
  const requestId = req.body.request_id;

  if (req.body.status === "ERROR") {
    res.status(411).json({});
    prismaClient.outputImages.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        status: "Failed",
        imageUrl: req.body.payload.images[0].url,
      },
    });
    return;
  }

  await prismaClient.outputImages.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      status: "Generated",
      imageUrl: req.body.payload.images[0].url,
    },
  });

  res.json({
    message: "Webhook received",
  });
});

app.get("/model/status/:modelId", authMiddleware, async (req, res) => {
  try {
    const modelId = req.params.modelId;

    const model = await prismaClient.model.findUnique({
      where: {
        id: modelId,
        userId: req.userId,
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Model not found",
      });
      return;
    }

    // Return basic model info with status
    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        status: model.trainingStatus,
        thumbnail: model.thumbnail,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
    });
    return;
  } catch (error) {
    console.error("Error checking model status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check model status",
    });
    return;
  }
});

app.use("/payment", paymentRoutes);
app.use("/api/webhook", webhookRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});