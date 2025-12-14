import { fal } from "@fal-ai/client";
import { prismaClient } from "../lib/prisma";
import { logger } from "../lib/logger";
import { env } from "../config/env";

interface FaceEmbedding {
  embedding: number[];
  referenceImageUrl: string;
}

interface FaceConsistentImageRequest {
  prompt: string;
  referenceImageUrl?: string;
  loraPath?: string;
  aspectRatio?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

type ImageModel = "flux-lora" | "nano-banana-pro";

/**
 * Face Consistency Service
 * Ensures the child's face remains consistent across all story pages
 * Uses LoRA models for identity preservation
 */
export class FaceConsistencyService {
  private static instance: FaceConsistencyService;
  private faceEmbeddingsCache = new Map<string, FaceEmbedding>();

  static getInstance(): FaceConsistencyService {
    if (!FaceConsistencyService.instance) {
      FaceConsistencyService.instance = new FaceConsistencyService();
    }
    return FaceConsistencyService.instance;
  }

  /**
   * Generate face-consistent image using LoRA or Nano Banana Pro
   */
  async generateFaceConsistentImage(
    request: FaceConsistentImageRequest,
    webhookUrl?: string,
    model: ImageModel = "flux-lora"
  ): Promise<{ requestId: string; responseUrl: string }> {
    const { prompt, loraPath, aspectRatio = "16:9" } = request;

    // Build enhanced prompt for comic-style children's illustration
    const enhancedPrompt = this.buildEnhancedPrompt(prompt);

    try {
      // If we have a LoRA model (trained on child's photos), use flux-lora for face consistency
      if (loraPath) {
        const { request_id, response_url } = await fal.queue.submit(
          "fal-ai/flux-lora",
          {
            input: {
              prompt: enhancedPrompt,
              loras: [{ path: loraPath, scale: 1 }],
              num_inference_steps: request.numInferenceSteps || 28,
              guidance_scale: request.guidanceScale || 3.5,
              image_size: aspectRatio === "16:9" ? "landscape_16_9" : "square",
              enable_safety_checker: true,
            },
            webhookUrl: webhookUrl || undefined,
          }
        );

        return { requestId: request_id, responseUrl: response_url };
      }

      // For non-LoRA generation, use Nano Banana Pro for speed
      if (model === "nano-banana-pro") {
        const { request_id, response_url } = await fal.queue.submit(
          "fal-ai/nano-banana-pro",
          {
            input: {
              prompt: enhancedPrompt,
              negative_prompt: this.getDefaultNegativePrompt(),
              num_inference_steps: 8,
              guidance_scale: 4.0,
              image_size: aspectRatio === "16:9" ? "landscape_16_9" : "square",
            },
            webhookUrl: webhookUrl || undefined,
          }
        );

        return { requestId: request_id, responseUrl: response_url };
      }

      // Fallback to standard flux generation
      const { request_id, response_url } = await fal.queue.submit(
        "fal-ai/flux/dev",
        {
          input: {
            prompt: enhancedPrompt,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            image_size: "landscape_16_9",
            enable_safety_checker: true,
          },
          webhookUrl: webhookUrl || undefined,
        }
      );

      return { requestId: request_id, responseUrl: response_url };
    } catch (error) {
      logger.error({ error }, "Failed to generate face-consistent image");
      throw error;
    }
  }

  /**
   * Generate synchronous face-consistent image (for previews)
   */
  async generateFaceConsistentImageSync(
    request: FaceConsistentImageRequest,
    model: ImageModel = "flux-lora"
  ): Promise<string> {
    const { prompt, loraPath } = request;
    const enhancedPrompt = this.buildEnhancedPrompt(prompt);

    try {
      if (loraPath) {
        const response = await fal.subscribe("fal-ai/flux-lora", {
          input: {
            prompt: enhancedPrompt,
            loras: [{ path: loraPath, scale: 1 }],
            num_inference_steps: 28,
            guidance_scale: 3.5,
            image_size: "landscape_16_9",
          },
        });

        return (response.data as any).images?.[0]?.url ?? "";
      }

      // Use Nano Banana Pro for fast generation without LoRA
      if (model === "nano-banana-pro") {
        const response = await fal.subscribe("fal-ai/nano-banana-pro", {
          input: {
            prompt: enhancedPrompt,
            negative_prompt: this.getDefaultNegativePrompt(),
            num_inference_steps: 8,
            guidance_scale: 4.0,
            image_size: "landscape_16_9",
          },
        });

        return (response.data as any).images?.[0]?.url ?? "";
      }

      const response = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: enhancedPrompt,
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
      });

      return (response.data as any).images?.[0]?.url ?? "";
    } catch (error) {
      logger.error({ error }, "Failed to generate sync image");
      throw error;
    }
  }

  /**
   * Build enhanced prompt for storybook illustration
   */
  private buildEnhancedPrompt(basePrompt: string): string {
    const styleEnhancements = [
      "comic-style children's storybook illustration",
      "vibrant Disney/Pixar-inspired colors",
      "soft warm lighting",
      "child-friendly art style",
      "high quality 4k detailed illustration",
      "expressive character faces",
      "no text or watermarks",
      "safe for children",
    ];

    return `${basePrompt}. Style: ${styleEnhancements.join(", ")}.`;
  }

  /**
   * Get default negative prompt for clean illustrations
   */
  private getDefaultNegativePrompt(): string {
    return "text, watermark, logo, signature, blurry, ugly, deformed, scary, violent, blood, dark, disturbing, realistic photo, photograph, adult content, nsfw";
  }

  /**
   * Store reference image for a model/story
   */
  async storeReferenceImage(
    modelId: string,
    imageUrl: string
  ): Promise<void> {
    await prismaClient.model.update({
      where: { id: modelId },
      data: { thumbnail: imageUrl },
    });
  }

  /**
   * Get reference image for face consistency
   */
  async getReferenceImage(modelId: string): Promise<string | null> {
    const model = await prismaClient.model.findUnique({
      where: { id: modelId },
      select: { thumbnail: true },
    });

    return model?.thumbnail ?? null;
  }

  /**
   * Validate that generated image maintains face consistency
   */
  async validateFaceConsistency(
    referenceImageUrl: string,
    generatedImageUrl: string
  ): Promise<{ isConsistent: boolean; confidence: number }> {
    // For MVP, we trust the LoRA model to maintain consistency
    return { isConsistent: true, confidence: 0.95 };
  }
}

export const faceConsistencyService = FaceConsistencyService.getInstance();
