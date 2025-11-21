import { fal } from "@fal-ai/client";
import { prismaClient } from "../lib/prisma";
import { env } from "../config/env";

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
    textLength: "1-2 short sentences per page",
  },
  "6-8": {
    language:
      "simple but engaging vocabulary, complete sentences, gentle tension",
    themes: "adventure, problem-solving, friendship, family, nature",
    pageCount: 8,
    textLength: "2-3 sentences per page",
  },
  "9-12": {
    language:
      "rich vocabulary, complex sentence structures, character development",
    themes: "bravery, teamwork, moral lessons, discovery, mystery",
    pageCount: 12,
    textLength: "3-4 sentences per page",
  },
} as const;

export class StoryService {
  private static instance: StoryService;

  static getInstance() {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  async generateStoryScript(characterName: string, theme: string) {
    const prompt = `
      You are a professional children's book author.
      Write a 5-page children's story about a hero named "${characterName}".
      The adventure theme is "${theme}".

      Return ONLY valid JSON with this shape:
      {
        "title": "string",
        "pages": [
          { "pageNumber": 1, "text": "string", "imageDescription": "string" }
        ]
      }
    `;

    return this.invokeFal(prompt);
  }

  async generatePersonalizedStoryScript(
    characterName: string,
    input: PersonalizedStoryInput
  ) {
    const ageRange = this.getAgeRange(input.childAge);
    const guidance = AGE_GUIDANCE[ageRange];

    const prompt = `
      You are creating a personalized story for ${input.childAge}-year-old ${
      input.childName
    }.
      - Story length: ${guidance.pageCount} pages (${guidance.textLength})
      - Theme: ${input.theme}
      - Category: ${input.category}
      - Main character: ${input.childName} (described visually as ${characterName})
      - Language style: ${guidance.language}
      - Moral focus: ${guidance.themes}
      ${input.dedication ? `- Dedication: "${input.dedication}"` : ""}

      Return ONLY valid JSON with the structure:
      {
        "title": "Personalized title including ${input.childName}",
        "pages": [
          { "pageNumber": 1, "text": "story text", "imageDescription": "visual prompt" }
        ]
      }
    `;

    return this.invokeFal(prompt);
  }

  async createStory(
    userId: string,
    modelId: string,
    script: StoryScript,
    artStyle: string
  ) {
    const story = await prismaClient.story.create({
      data: {
        title: script.title,
        userId,
        modelId,
        status: "Generating",
      },
    });

    const pages = await Promise.all(
      script.pages.map((page) =>
        prismaClient.storyPage.create({
          data: {
            storyId: story.id,
            pageNumber: page.pageNumber,
            content: page.text,
            imagePrompt: `${page.imageDescription}, ${artStyle}, children's book illustration, pastel colors, 4k`,
            status: "Pending",
          },
        })
      )
    );

    return { story, pages };
  }

  async triggerPageGeneration(pageId: string, prompt: string, tensorPath: string) {
    const { request_id } = await fal.queue.submit("fal-ai/flux-lora", {
      input: {
        prompt,
        loras: [{ path: tensorPath, scale: 1 }],
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
      webhookUrl: env.WEBHOOK_BASE_URL
        ? `${env.WEBHOOK_BASE_URL}/api/webhook/story/page`
        : undefined,
    });

    await prismaClient.storyPage.update({
      where: { id: pageId },
      data: {
        falAiRequestId: request_id,
        status: "Pending",
      },
    });
  }

  private async invokeFal(prompt: string) {
    const result = await fal.subscribe("fal-ai/llama-3-70b-instruct", {
      input: {
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
      },
    });

    const rawOutput =
      (result.data as any).output || (result.data as any).text || "";
    const jsonPayload = rawOutput.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(jsonPayload) as StoryScript;
  }

  private getAgeRange(age: number): keyof typeof AGE_GUIDANCE {
    if (age <= 5) return "3-5";
    if (age <= 8) return "6-8";
    return "9-12";
  }
}

