import { Router } from "express";
import { prismaClient } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { StoryService } from "../services/story.service";
import { storyGenerationLimiter } from "../middleware/rateLimiter";

const router = Router();
const storyService = StoryService.getInstance();

router.post("/generate", authMiddleware, storyGenerationLimiter, async (req, res) => {
  try {
    const { modelId, theme, artStyle } = req.body;
    const userId = req.userId!;

    if (!modelId || !theme) {
      res.status(400).json({ message: "Missing modelId or theme" });
      return;
    }

    const model = await prismaClient.model.findUnique({
      where: { id: modelId },
    });

    if (!model?.tensorPath) {
      res.status(404).json({ message: "Model not found or not trained" });
      return;
    }

    const script = await storyService.generateStoryScript(model.name, theme);

    const { story, pages } = await storyService.createStory(
      userId,
      modelId,
      script,
      artStyle || "storybook illustration"
    );

    for (const page of pages) {
      await storyService.triggerPageGeneration(
        page.id,
        page.imagePrompt,
        model.tensorPath
      );
    }

    res.json({
      message: "Story generation started",
      storyId: story.id,
      estimatedTime: "2 minutes",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate story",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const stories = await prismaClient.story.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      include: {
        pages: { orderBy: { pageNumber: "asc" } },
        model: true,
      },
    });
    res.json({ stories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const story = await prismaClient.story.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        pages: { orderBy: { pageNumber: "asc" } },
        model: true,
      },
    });

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    res.json({ story });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch story" });
  }
});

export const storyRouter = router;

