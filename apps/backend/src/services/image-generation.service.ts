import { fal } from "@fal-ai/client";
import { prismaClient } from "../lib/prisma";
import { logger } from "../lib/logger";
import { env } from "../config/env";

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  negativePrompt?: string;
  seed?: number;
}

interface ImageGenerationResult {
  requestId: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
}

const STORY_PAGE_WEBHOOK = env.WEBHOOK_BASE_URL
  ? `${env.WEBHOOK_BASE_URL}/api/webhook/story/page`
  : undefined;

/**
 * Image Generation Service using Nano Banana Pro
 * Optimized for fast, consistent storybook illustrations
 */
export class ImageGenerationService {
  private static instance: ImageGenerationService;
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  /**
   * Generate storybook illustration using Nano Banana Pro
   * Fast and optimized for consistent children's book style
   */
  async generateStorybookImage(
    request: ImageGenerationRequest,
    webhookUrl?: string
  ): Promise<ImageGenerationResult> {
    const enhancedPrompt = this.buildStorybookPrompt(request.prompt);

    try {
      const { request_id, response_url } = await fal.queue.submit(
        "fal-ai/nano-banana-pro",
        {
          input: {
            prompt: enhancedPrompt,
            negative_prompt: request.negativePrompt || this.getDefaultNegativePrompt(),
            image_size: this.getImageSize(request.aspectRatio || "16:9"),
            num_inference_steps: 8, // Nano is fast with fewer steps
            guidance_scale: 4.0,
            seed: request.seed,
          },
          webhookUrl: webhookUrl || STORY_PAGE_WEBHOOK || undefined,
        }
      );

      logger.info(
        { requestId: request_id, promptLength: enhancedPrompt.length },
        "Storybook image generation queued with Nano Banana Pro"
      );

      return {
        requestId: request_id,
        success: true,
      };
    } catch (error) {
      logger.error({ error, prompt: request.prompt }, "Failed to queue image generation");
      return {
        requestId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate image synchronously with retry logic
   */
  async generateImageSync(
    request: ImageGenerationRequest,
    retryCount: number = 0
  ): Promise<string> {
    const enhancedPrompt = this.buildStorybookPrompt(request.prompt);

    try {
      const response = await fal.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: request.negativePrompt || this.getDefaultNegativePrompt(),
          image_size: this.getImageSize(request.aspectRatio || "16:9"),
          num_inference_steps: 8,
          guidance_scale: 4.0,
          seed: request.seed,
        },
      });

      const imageUrl = (response.data as any)?.images?.[0]?.url ?? "";

      if (!imageUrl && retryCount < this.maxRetries) {
        logger.warn(
          { retryCount, prompt: request.prompt.substring(0, 50) },
          "Empty image URL, retrying..."
        );
        await this.delay(this.retryDelays[retryCount] || 4000);
        return this.generateImageSync(request, retryCount + 1);
      }

      logger.info({ imageUrl: !!imageUrl }, "Sync image generated");
      return imageUrl;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(
          { error, retryCount },
          "Image generation failed, retrying..."
        );
        await this.delay(this.retryDelays[retryCount] || 4000);
        return this.generateImageSync(request, retryCount + 1);
      }

      logger.error({ error, prompt: request.prompt }, "Image generation failed after retries");
      throw error;
    }
  }

  /**
   * Generate image using LoRA model (for face-consistent hero images)
   */
  async generateWithLoRA(
    prompt: string,
    loraPath: string,
    aspectRatio: "1:1" | "16:9" = "16:9"
  ): Promise<ImageGenerationResult> {
    const enhancedPrompt = this.buildStorybookPrompt(prompt);

    try {
      const { request_id, response_url } = await fal.queue.submit(
        "fal-ai/flux-lora",
        {
          input: {
            prompt: enhancedPrompt,
            loras: [{ path: loraPath, scale: 1 }],
            num_inference_steps: 28,
            guidance_scale: 3.5,
            image_size: aspectRatio === "16:9" ? "landscape_16_9" : "square",
            enable_safety_checker: true,
          },
          webhookUrl: STORY_PAGE_WEBHOOK || undefined,
        }
      );

      logger.info({ requestId: request_id }, "LoRA image generation queued");

      return {
        requestId: request_id,
        success: true,
      };
    } catch (error) {
      logger.error({ error }, "Failed to queue LoRA image generation");
      return {
        requestId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate LoRA image synchronously
   */
  async generateWithLoRASync(
    prompt: string,
    loraPath: string,
    retryCount: number = 0
  ): Promise<string> {
    const enhancedPrompt = this.buildStorybookPrompt(prompt);

    try {
      const response = await fal.subscribe("fal-ai/flux-lora", {
        input: {
          prompt: enhancedPrompt,
          loras: [{ path: loraPath, scale: 1 }],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          image_size: "landscape_16_9",
        },
      });

      const imageUrl = (response.data as any)?.images?.[0]?.url ?? "";

      if (!imageUrl && retryCount < this.maxRetries) {
        await this.delay(this.retryDelays[retryCount] || 4000);
        return this.generateWithLoRASync(prompt, loraPath, retryCount + 1);
      }

      return imageUrl;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelays[retryCount] || 4000);
        return this.generateWithLoRASync(prompt, loraPath, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Build enhanced prompt for storybook illustrations
   */
  private buildStorybookPrompt(basePrompt: string): string {
    const stylePrefix = "Children's storybook illustration, ";
    const styleSuffix = ", vibrant colors, warm lighting, whimsical, child-friendly, Disney Pixar style, high quality, detailed, 4k";
    
    return `${stylePrefix}${basePrompt}${styleSuffix}`;
  }

  /**
   * Get default negative prompt for clean illustrations
   */
  private getDefaultNegativePrompt(): string {
    return "text, watermark, logo, signature, blurry, ugly, deformed, scary, violent, blood, dark, disturbing, realistic photo, photograph, adult content, nsfw";
  }

  /**
   * Convert aspect ratio to fal.ai image size format
   */
  private getImageSize(aspectRatio: string): string {
    const sizeMap: Record<string, string> = {
      "1:1": "square",
      "16:9": "landscape_16_9",
      "9:16": "portrait_9_16",
      "4:3": "landscape_4_3",
      "3:4": "portrait_3_4",
    };
    return sizeMap[aspectRatio] || "landscape_16_9";
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const imageGenerationService = ImageGenerationService.getInstance();

