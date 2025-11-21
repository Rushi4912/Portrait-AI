import { Router } from "express";
import { prismaClient } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { StoryService } from "../services/story.service";
import { storyGenerationLimiter } from "../middleware/rateLimiter";

const router = Router();
const storyService = StoryService.getInstance();

router.get("/templates", async (_req, res) => {
  const templates = [
    {
      id: "magical-adventure",
      name: "The Magical Adventure",
      ageRange: "3-5",
      category: "adventure",
    },
    {
      id: "brave-explorer",
      name: "The Brave Explorer",
      ageRange: "6-8",
      category: "adventure",
    },
    {
      id: "kind-friend",
      name: "The Kind Friend",
      ageRange: "3-5",
      category: "friendship",
    },
    {
      id: "learning-adventure",
      name: "The Learning Adventure",
      ageRange: "6-8",
      category: "learning",
    },
    {
      id: "bedtime-dream",
      name: "The Bedtime Dream",
      ageRange: "3-5",
      category: "bedtime",
    },
    {
      id: "animal-friends",
      name: "The Animal Friends",
      ageRange: "6-8",
      category: "friendship",
    },
  ];

  res.json({ templates });
});

router.post("/generate", authMiddleware, storyGenerationLimiter, async (req, res) => {
  try {
    const { modelId, childName, childAge, storyLength, dedication } = req.body;

    const model = await prismaClient.model.findUnique({
      where: { id: modelId },
    });

    if (!model?.tensorPath) {
      res.status(404).json({ message: "Model not found" });
      return;
    }

    const script = await storyService.generateStoryScript(
      model.name,
      "magical adventure"
    );
    const { story, pages } = await storyService.createStory(
      req.userId!,
      modelId,
      script,
      "storybook illustration"
    );

    await prismaClient.story.update({
      where: { id: story.id },
      data: { childName, childAge, storyLength, dedication },
    });

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
      pages: pages.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate story" });
  }
});

router.get("/stories", authMiddleware, async (req, res) => {
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

router.get("/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const totalStories = await prismaClient.story.count({ where: { userId } });
    const completedStories = await prismaClient.story.count({
      where: { userId, status: "Completed" },
    });

    res.json({ totalStories, completedStories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export const storybookRouter = router;

