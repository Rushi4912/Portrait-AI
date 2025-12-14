import { fal } from "@fal-ai/client";
import { prismaClient } from "../lib/prisma";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { FaceConsistencyService } from "./face-consistency.service";
import { StoryCompletionService } from "./story-completion.service";

interface PersonalizedStoryInput {
  childName: string;
  childAge: number;
  storyLength: "short" | "medium" | "long";
  category: string;
  dedication?: string;
  theme: string;
}

interface StoryPageInput {
  pageNumber: number;
  text: string;
  imageDescription: string;
  emotion?: string;
}

interface StoryScript {
  title: string;
  pages: StoryPageInput[];
}

const AGE_GUIDANCE = {
  "3-5": {
    language:
      "very simple words, short sentences, repetition, basic concepts like colors and numbers",
    themes: "friendship, sharing, bedtime, animals, colors, counting",
    pageCount: 5,
    textLength: "1-2 short sentences per page (15-25 words)",
  },
  "6-8": {
    language:
      "simple but engaging vocabulary, complete sentences, gentle tension",
    themes: "adventure, problem-solving, friendship, family, nature",
    pageCount: 8,
    textLength: "2-3 sentences per page (25-35 words)",
  },
  "9-12": {
    language:
      "rich vocabulary, complex sentence structures, character development",
    themes: "bravery, teamwork, moral lessons, discovery, mystery",
    pageCount: 12,
    textLength: "3-4 sentences per page (35-50 words)",
  },
} as const;

const STORY_WEBHOOK = env.WEBHOOK_BASE_URL
  ? `${env.WEBHOOK_BASE_URL}/api/webhook/story/page`
  : undefined;

export class StoryService {
  private static instance: StoryService;
  private faceConsistency = FaceConsistencyService.getInstance();
  private storyCompletion = StoryCompletionService.getInstance();

  static getInstance() {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  /**
   * Generate story script using LLM
   */
  async generateStoryScript(characterName: string, theme: string) {
    const prompt = `
      You are a professional children's book author.
      Write a 5-page children's story about a hero named "${characterName}".
      The adventure theme is "${theme}".

      Return ONLY valid JSON with this shape:
      {
        "title": "string",
        "pages": [
          { 
            "pageNumber": 1, 
            "text": "story text (20-30 words)", 
            "imageDescription": "detailed visual scene description for illustration",
            "emotion": "character's emotion (happy, excited, brave, curious, etc.)"
          }
        ]
      }
    `;

    return this.invokeFal(prompt);
  }

  /**
   * Generate personalized story script with age-appropriate content
   */
  async generatePersonalizedStoryScript(
    characterName: string,
    input: PersonalizedStoryInput
  ): Promise<StoryScript> {
    const ageRange = this.getAgeRange(input.childAge);
    const guidance = AGE_GUIDANCE[ageRange];

    const prompt = `
      You are creating a personalized children's storybook for ${input.childAge}-year-old ${input.childName}.
      
      STORY PARAMETERS:
      - Story length: ${guidance.pageCount} pages (${guidance.textLength})
      - Theme: ${input.theme}
      - Category: ${input.category}
      - Main character: ${input.childName} (described visually as ${characterName})
      - Language style: ${guidance.language}
      - Moral themes: ${guidance.themes}
      ${input.dedication ? `- Dedication: "${input.dedication}"` : ""}

      CRITICAL REQUIREMENTS:
      1. ${input.childName} MUST be the hero on EVERY page
      2. Use age-appropriate vocabulary for ${input.childAge}-year-olds
      3. Include comic-style dialogue and engaging action
      4. Each page needs a clear, illustratable scene
      5. End with a positive, satisfying conclusion
      6. The imageDescription must describe ${input.childName} in the scene

      Return ONLY valid JSON with this exact structure:
      {
        "title": "Creative title featuring ${input.childName}",
        "pages": [
          { 
            "pageNumber": 1, 
            "text": "Story text to be read aloud", 
            "imageDescription": "Detailed visual description: ${input.childName} [describe action/scene/setting with specific visual details]",
            "emotion": "primary emotion (happy, excited, curious, brave, surprised)"
          }
        ]
      }
    `;

    return this.invokeFal(prompt);
  }

  /**
   * Create story record and pages in database
   */
  async createStory(
    userId: string,
    modelId: string,
    script: StoryScript,
    artStyle: string,
    personalization?: Partial<PersonalizedStoryInput> & {
      includeAudio?: boolean;
      voiceId?: string;
    }
  ) {
    const story = await prismaClient.story.create({
      data: {
        title: script.title,
        userId,
        modelId,
        status: "Generating",
        childName: personalization?.childName,
        childAge: personalization?.childAge,
        storyLength: personalization?.storyLength as any,
        category: personalization?.category as any,
        dedication: personalization?.dedication,
        includeAudio: personalization?.includeAudio || false,
        voiceId: personalization?.voiceId || "sarah",
      },
    });

    const pages = await Promise.all(
      script.pages.map((page) =>
        prismaClient.storyPage.create({
          data: {
            storyId: story.id,
            pageNumber: page.pageNumber,
            content: page.text,
            imagePrompt: this.buildImagePrompt(page, artStyle, personalization?.childName),
            status: "Pending",
          },
        })
      )
    );

    logger.info({ storyId: story.id, pageCount: pages.length }, "Story created");

    return { story, pages };
  }

  /**
   * Build enhanced image prompt for face-consistent illustration
   */
  private buildImagePrompt(
    page: StoryPageInput,
    artStyle: string,
    childName?: string
  ): string {
    const basePrompt = page.imageDescription;
    const emotionContext = page.emotion ? `, character showing ${page.emotion} expression` : "";
    
    return `Comic-style children's storybook illustration.
Character: ${childName || "the child hero"} (match face reference exactly)${emotionContext}.
Scene: ${basePrompt}
Style: ${artStyle}, vibrant Disney/Pixar-inspired colors, child-friendly, warm lighting, high quality 4k.
Do not include any text, watermarks, or logos.`;
  }

  /**
   * Trigger face-consistent image generation for a page
   */
  async triggerPageGeneration(
    pageId: string,
    prompt: string,
    tensorPath: string
  ) {
    try {
      const { requestId } = await this.faceConsistency.generateFaceConsistentImage(
        {
          prompt,
          loraPath: tensorPath,
          aspectRatio: "16:9",
          numInferenceSteps: 28,
          guidanceScale: 3.5,
        },
        STORY_WEBHOOK
      );

      await prismaClient.storyPage.update({
        where: { id: pageId },
        data: {
          falAiRequestId: requestId,
          status: "Pending",
        },
      });

      logger.info({ pageId, requestId }, "Page generation triggered");

      return { requestId };
    } catch (error) {
      logger.error({ error, pageId }, "Failed to trigger page generation");
      
      await prismaClient.storyPage.update({
        where: { id: pageId },
        data: { status: "Failed" },
      });

      throw error;
    }
  }

  /**
   * Retry failed page generation
   */
  async retryPageGeneration(pageId: string) {
    const page = await prismaClient.storyPage.findUnique({
      where: { id: pageId },
      include: { story: { include: { model: true } } },
    });

    if (!page) {
      throw new Error("Page not found");
    }

    if (!page.story.model.tensorPath) {
      throw new Error("Model not trained");
    }

    return this.triggerPageGeneration(
      pageId,
      page.imagePrompt,
      page.story.model.tensorPath
    );
  }

  /**
   * Get story with all pages and generation status
   */
  async getStoryWithStatus(storyId: string, userId: string) {
    const story = await prismaClient.story.findFirst({
      where: { id: storyId, userId },
      include: {
        pages: { orderBy: { pageNumber: "asc" } },
        model: true,
      },
    });

    if (!story) {
      return null;
    }

    const generatedPages = story.pages.filter((p) => p.status === "Generated").length;
    const failedPages = story.pages.filter((p) => p.status === "Failed").length;
    const progress = story.pages.length
      ? Math.round((generatedPages / story.pages.length) * 100)
      : 0;

    // Check for stuck pending pages and update them if needed (webhook fallback)
    if (story.status === "Generating" || story.status === "Pending") {
      const pendingCount = story.pages.filter(p => p.status === "Pending").length;
      if (pendingCount > 0) {
        logger.info(
          { storyId, pendingCount, totalPages: story.pages.length },
          "Story has pending pages - initiating webhook fallback check"
        );
      }
      this.checkPendingPages(story as any).catch((error) => {
        logger.error({ error, storyId }, "Failed to check pending pages");
      });
    }

    return {
      ...story,
      progress,
      generatedPages,
      failedPages,
      totalPages: story.pages.length,
    };
  }

  /**
   * Invoke fal.ai LLM for story generation using Google Gemini
   */
  private async invokeFal(prompt: string): Promise<StoryScript> {
    try {
      // Use the any-llm endpoint with Google Gemini 2.0 Flash
      logger.info("Generating story script with Gemini 2.0 Flash");
      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "google/gemini-2.0-flash-001",
          prompt,
          max_tokens: 3000,
          temperature: 0.7,
        } as any,
      });

      const rawOutput =
        (result.data as any).output || 
        (result.data as any).text || 
        (result.data as any).response || "";

      logger.info({ outputLength: rawOutput?.length }, "Received LLM response");

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/) ||
                        rawOutput.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, rawOutput];
      
      const jsonPayload = (jsonMatch[1] || rawOutput)
        .replace(/```json\n?|```/g, "")
        .trim();

      const parsed = JSON.parse(jsonPayload) as StoryScript;

      // Validate structure
      if (!parsed.title || !Array.isArray(parsed.pages)) {
        throw new Error("Invalid story structure");
      }

      logger.info({ title: parsed.title, pageCount: parsed.pages.length }, "Story script generated successfully");
      return parsed;
    } catch (error) {
      logger.error({ error }, "Failed to generate story script with Gemini 2.0");
      
      // Fallback to Anthropic Claude
      try {
        logger.info("Attempting fallback with Claude 3.5 Sonnet");
        const fallbackResult = await fal.subscribe("fal-ai/any-llm", {
          input: {
            model: "anthropic/claude-3.5-sonnet",
            prompt,
            max_tokens: 2000,
            temperature: 0.7,
          } as any,
        });

        const rawOutput =
          (fallbackResult.data as any).output || 
          (fallbackResult.data as any).text || "";
        const jsonPayload = rawOutput.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(jsonPayload) as StoryScript;
        logger.info({ title: parsed.title }, "Fallback story generation succeeded");
        return parsed;
      } catch (fallbackError) {
        logger.error({ fallbackError }, "Fallback story generation also failed");
        throw new Error("Story generation failed");
      }
    }
  }

  private getAgeRange(age: number): keyof typeof AGE_GUIDANCE {
    if (age <= 5) return "3-5";
    if (age <= 8) return "6-8";
    return "9-12";
  }

  /**
   * Check for pending pages that might have missed their webhook
   */
  private async checkPendingPages(story: {
    id: string;
    pages: { id: string; status: string; falAiRequestId: string | null; updatedAt: Date; pageNumber: number }[];
    model: { tensorPath: string | null };
  }) {
    const pendingPages = story.pages.filter(
      (p) =>
        p.status === "Pending" &&
        p.falAiRequestId &&
        Date.now() - new Date(p.updatedAt).getTime() > 10000 // Only check if pending for > 10s
    );

    if (pendingPages.length === 0) return;

    logger.info(
      { storyId: story.id, pendingCount: pendingPages.length },
      "Checking status of pending pages (webhook fallback)"
    );

    await Promise.allSettled(
      pendingPages.map(async (page) => {
        try {
          // Use fal-ai/flux-lora if tensorPath is present (most common for stories), otherwise nano-banana
          const endpoint = story.model.tensorPath
            ? "fal-ai/flux-lora"
            : "fal-ai/nano-banana-pro";

          // Check status using result (will wait if still processing, or return if done)
          // We use a shorter timeout check by just getting the result
          const result = await fal.queue.result(endpoint, {
            requestId: page.falAiRequestId!,
          });

          const imageUrl = (result.data as any)?.images?.[0]?.url;

          if (imageUrl) {
            logger.info(
              { pageId: page.id, requestId: page.falAiRequestId },
              "Retrieved image from fal.ai queue (webhook missed)"
            );

            await prismaClient.storyPage.update({
              where: { id: page.id },
              data: {
                imageUrl,
                status: "Generated",
              },
            });

            // Check completion
            await this.storyCompletion.checkStoryCompletion(story.id);
          }
        } catch (error) {
          // If error is "Request not found" or similar, maybe mark as failed?
          // For now, just log. It might still be processing.
          logger.warn(
            { error, pageId: page.id, requestId: page.falAiRequestId },
            "Failed to check fal.ai status for page"
          );
        }
      })
    );
  }
}

export const storyService = StoryService.getInstance();
