import { fal } from "@fal-ai/client";
import express from "express";
import {
  TrainModel,
  GenerateImage,
  GenerateImagesFromPack,
} from "common/types";
import { prismaClient } from "../../packages/db";
// import { S3Client } from "bun";
import { FalAIModel } from "./models/FalAiModel";
import cors from "cors";

import dotenv from "dotenv";


const IMAGE_GEN_CREDITS = 1;
const TRAIN_MODEL_CREDITS = 20;

dotenv.config();

const PORT = process.env.PORT || 8080;

const falAiModel = new FalAIModel();

const app = express();

app.use(cors());
app.use(express.json());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = userId as string;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

app.use('/ai', authMiddleware);
app.use('/pack', authMiddleware);
app.use('/models', authMiddleware);
app.use('/image', authMiddleware);

app.get("/pre-signed-url", async (req, res) => {
  try {
    const key = `models/${Date.now()}_${Math.random()}.zip`;
    res.json({ key });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate pre-signed URL' });
  }
});

app.post("/ai/training", async (req, res) => {
  try {
    const parsedBody = TrainModel.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid input",
        error: parsedBody.error,
      });
    }

    const credits = await prismaClient.userCredit.findUnique({ userId: req.userId! });

    if ((credits?.amount ?? 0) < TRAIN_MODEL_CREDITS) {
      return res.status(402).json({
        message: "Not enough credits",
      });
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
        trainingStatus: "Pending",
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

app.post("/ai/generate", async (req, res) => {
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
  // check if the user has enough credits
  const credits = await prismaClient.userCredit.findUnique({
    where: {
      userId: req.userId!,
    },
  });

  if ((credits?.amount ?? 0) < IMAGE_GEN_CREDITS) {
    res.status(411).json({
      message: "Not enough credits",
    });
    return;
  }

  const { request_id, response_url } = await falAiModel.generateImage(
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

  await prismaClient.userCredit.update({
    where: {
      userId: req.userId!,
    },
    data: {
      amount: { decrement: IMAGE_GEN_CREDITS },
    },
  });

  res.json({
    imageId: data.id,
  });
});

app.post("/pack/generate",  async (req, res) => {
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

app.get("/image/bulk", async (req, res) => {
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

app.get("/models", async (req, res) => {
  const models = await prismaClient.model.findMany({
    where: {
      OR: [{ userId: req.userId }, { open: true }],
    },
  });

  res.json({
    models,
  });
});

app.post("/fal-ai/webhook/train", async (req, res) => {
  try {
    const requestId = req.body.request_id;
    if (!requestId) {
      return res.status(400).json({ message: "Missing request_id" });
    }

    const model = await prismaClient.model.findFirst({
      where: { falAiRequestId: requestId },
    });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    switch (req.body.status) {
      case "ERROR":
        await prismaClient.model.update({
          where: { id: model.id },
          data: { trainingStatus: "Failed" },
        });
        break;

      case "COMPLETED":
      case "OK":
        let loraUrl;
        if (req.body.payload && req.body.payload.diffusers_lora_file && req.body.payload.diffusers_lora_file.url) {
          loraUrl = req.body.payload.diffusers_lora_file.url;
          console.log("Using lora URL from webhook payload:", loraUrl);
        } else {
          console.log("Fetching result from fal.ai");
          const result = await fal.queue.result("fal-ai/flux-lora-fast-training", {
            requestId,
          });
          console.log("Fal.ai result:", result);
          const resultData = result.data as any;
          loraUrl = resultData.diffusers_lora_file.url;
        }

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
        break;

      default:
        await prismaClient.model.updateMany({
          where: {
            falAiRequestId: requestId,
          },
          data: {
            trainingStatus: "Pending",
          },
        });
    }

    res.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
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

app.get("/model/status/:modelId",  async (req, res) => {
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

app.use("/api/webhook", webhookRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});