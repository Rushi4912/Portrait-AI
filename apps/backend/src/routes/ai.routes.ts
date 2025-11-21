import { Router } from "express";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GenerateImage, GenerateImagesFromPack, TrainModel } from "common/types";
import { prismaClient } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { env } from "../config/env";
import { FalAIModel } from "../models/fal-ai.model";
import {
  modelTrainingLimiter,
  imageGenerationLimiter,
  storyGenerationLimiter,
} from "../middleware/rateLimiter";

const router = Router();
const falAiModel = new FalAIModel();

const s3Client = new S3Client({
  region: env.S3_REGION,
  credentials:
    env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        }
      : undefined,
});

router.get("/pre-signed-url", authMiddleware, async (_req, res) => {
  try {
    if (!env.BUCKET_NAME) {
      res.status(500).json({ error: "S3 bucket is not configured" });
      return;
    }

    const key = `models/${Date.now()}_${Math.random()}.zip`;
    const command = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      ContentType: "application/zip",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    res.json({ url, key });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate pre-signed URL",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post(
  "/ai/training",
  authMiddleware,
  modelTrainingLimiter,
  async (req, res) => {
    const parsedBody = TrainModel.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(422).json({ message: "Invalid input", error: parsedBody.error });
      return;
    }

    try {
      const { requestId } = await falAiModel.trainModel(
        parsedBody.data.zipUrl,
        parsedBody.data.name
      );

      const storyModel = await prismaClient.model.create({
        data: {
          name: parsedBody.data.name,
          type: parsedBody.data.type,
          age: parsedBody.data.age,
          ethinicity: parsedBody.data.ethinicity,
          eyeColor: parsedBody.data.eyeColor,
          bald: parsedBody.data.bald,
          userId: req.userId!,
          zipUrl: parsedBody.data.zipUrl,
          falAiRequestId: requestId,
        },
      });

      res.json({ modelId: storyModel.id });
    } catch (error) {
      res.status(500).json({
        message: "Training failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.post(
  "/ai/generate",
  authMiddleware,
  imageGenerationLimiter,
  async (req, res) => {
    const parsedBody = GenerateImage.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(422).json({ message: "Invalid request" });
      return;
    }

    const model = await prismaClient.model.findUnique({
      where: { id: parsedBody.data.modelId },
    });

    if (!model?.tensorPath) {
      res.status(404).json({ message: "Model not found or not trained" });
      return;
    }

    const credits = await prismaClient.userCredit.findUnique({
      where: { userId: req.userId! },
    });

    if ((credits?.amount ?? 0) < 1) {
      res.status(402).json({ message: "Not enough credits" });
      return;
    }

    const { requestId } = await falAiModel.generateImage(
      parsedBody.data.prompt,
      model.tensorPath
    );

    const output = await prismaClient.outputImages.create({
      data: {
        prompt: parsedBody.data.prompt,
        userId: req.userId!,
        modelId: parsedBody.data.modelId,
        imageUrl: "",
        falAiRequestId: requestId,
      },
    });

    await prismaClient.userCredit.update({
      where: { userId: req.userId! },
      data: { amount: { decrement: 1 } },
    });

    res.json({ imageId: output.id });
  }
);

router.post(
  "/pack/generate",
  authMiddleware,
  storyGenerationLimiter,
  async (req, res) => {
    const parsedBody = GenerateImagesFromPack.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(422).json({ message: "Invalid input" });
      return;
    }

    const prompts = await prismaClient.packPrompts.findMany({
      where: { packId: parsedBody.data.packId },
    });

    const model = await prismaClient.model.findUnique({
      where: { id: parsedBody.data.modelId },
    });

    if (!model?.tensorPath) {
      res.status(404).json({ message: "Model not found or not trained" });
      return;
    }

    const credits = await prismaClient.userCredit.findUnique({
      where: { userId: req.userId! },
    });

    const requiredCredits = prompts.length;
    if ((credits?.amount ?? 0) < requiredCredits) {
      res.status(402).json({ message: "Not enough credits" });
      return;
    }

    const requests = await Promise.all(
      prompts.map((prompt) =>
        falAiModel.generateImage(prompt.prompt, model.tensorPath!)
      )
    );

    const images = await Promise.all(
      prompts.map((prompt, index) =>
        prismaClient.outputImages.create({
          data: {
            prompt: prompt.prompt,
            userId: req.userId!,
            modelId: parsedBody.data.modelId,
            imageUrl: "",
            falAiRequestId: requests[index].requestId,
          },
        })
      )
    );

    await prismaClient.userCredit.update({
      where: { userId: req.userId! },
      data: { amount: { decrement: requiredCredits } },
    });

    res.json({ images: images.map((image) => image.id) });
  }
);

router.get("/pack/bulk", async (_req, res) => {
  const packs = await prismaClient.packs.findMany();
  res.json({ packs });
});

router.get("/image/bulk", authMiddleware, async (req, res) => {
  const ids = (req.query.ids as string[]) || [];
  const limit = parseInt((req.query.limit as string) ?? "100", 10);
  const offset = parseInt((req.query.offset as string) ?? "0", 10);

  const images = await prismaClient.outputImages.findMany({
    where: {
      id: { in: ids },
      userId: req.userId!,
      status: { not: "Failed" },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  res.json({ images });
});

router.get("/models", authMiddleware, async (req, res) => {
  const models = await prismaClient.model.findMany({
    where: {
      OR: [{ userId: req.userId }, { open: true }],
    },
  });

  res.json({ models });
});

router.get("/model/status/:modelId", authMiddleware, async (req, res) => {
  const model = await prismaClient.model.findUnique({
    where: { id: req.params.modelId, userId: req.userId },
  });

  if (!model) {
    res.status(404).json({ message: "Model not found" });
    return;
  }

  res.json({
    model: {
      id: model.id,
      name: model.name,
      status: model.trainingStatus,
      thumbnail: model.thumbnail,
      createdAt: model.createdAt,
    },
  });
});

export const aiRouter = router;

