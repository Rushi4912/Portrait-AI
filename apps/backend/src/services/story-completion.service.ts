import { prismaClient } from "../lib/prisma";
import { CacheService } from "./cache.service";
import { logger } from "../lib/logger";

export class StoryCompletionService {
  private static instance: StoryCompletionService;
  private cache = CacheService.getInstance();

  static getInstance() {
    if (!StoryCompletionService.instance) {
      StoryCompletionService.instance = new StoryCompletionService();
    }
    return StoryCompletionService.instance;
  }

  async checkStoryCompletion(storyId: string) {
    const story = await prismaClient.story.findUnique({
      where: { id: storyId },
      include: { pages: true },
    });

    if (!story) {
      logger.warn({ storyId }, "Story not found while checking completion");
      return false;
    }

    const allPagesReady = story.pages.every(
      (page) => page.status === "Generated" && Boolean(page.imageUrl)
    );

    if (!allPagesReady) {
      return false;
    }

    await prismaClient.story.update({
      where: { id: storyId },
      data: {
        status: "Completed",
        completedAt: new Date(),
      },
    });

    await this.generateStoryAnalytics(storyId);
    await this.cache.invalidate(`story:${story.userId}:*`);

    logger.info({ storyId }, "Story marked as completed");
    return true;
  }

  async getStoryStatus(storyId: string) {
    const story = await prismaClient.story.findUnique({
      where: { id: storyId },
      include: {
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return null;
    }

    const generatedPages = story.pages.filter(
      (page) => page.status === "Generated"
    ).length;

    const progress = story.pages.length
      ? Math.round((generatedPages / story.pages.length) * 100)
      : 0;

    return {
      storyId: story.id,
      title: story.title,
      status: story.status,
      progress,
      totalPages: story.pages.length,
      generatedPages,
      completedAt: story.completedAt,
    };
  }

  async getUserCompletionStats(userId: string) {
    const [totalStories, completedStories] = await Promise.all([
      prismaClient.story.count({ where: { userId } }),
      prismaClient.story.count({ where: { userId, status: "Completed" } }),
    ]);

    return {
      totalStories,
      completedStories,
      pendingStories: totalStories - completedStories,
      completionRate:
        totalStories === 0 ? 0 : Math.round((completedStories / totalStories) * 100),
    };
  }

  private async generateStoryAnalytics(storyId: string) {
    const pages = await prismaClient.storyPage.findMany({
      where: { storyId },
    });

    const totalWords = pages.reduce(
      (count, page) => count + page.content.split(" ").length,
      0
    );

    const estimatedReadTimeSec = Math.ceil(totalWords / 200) * 60;

    await prismaClient.storyAnalytics.upsert({
      where: { storyId },
      update: { avgReadTime: estimatedReadTimeSec },
      create: {
        storyId,
        avgReadTime: estimatedReadTimeSec,
      },
    });
  }
}

