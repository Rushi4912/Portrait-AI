import { fal } from "@fal-ai/client";
import { env } from "../config/env";

const TRAINING_WEBHOOK =
  env.WEBHOOK_BASE_URL?.concat("/fal-ai/webhook/train") ?? "";
const IMAGE_WEBHOOK =
  env.WEBHOOK_BASE_URL?.concat("/fal-ai/webhook/image") ?? "";

export class FalAIModel {
  async trainModel(zipUrl: string, triggerWord: string) {
    const { request_id, response_url } = await fal.queue.submit(
      "fal-ai/flux-lora-fast-training",
      {
        input: {
          images_data_url: zipUrl,
          trigger_word: triggerWord,
        },
        webhookUrl: TRAINING_WEBHOOK || undefined,
      }
    );

    return { requestId: request_id, responseUrl: response_url };
  }

  async generateImage(prompt: string, tensorPath: string) {
    const { request_id, response_url } = await fal.queue.submit(
      "fal-ai/flux-lora",
      {
        input: {
          prompt,
          loras: [{ path: tensorPath, scale: 1 }],
        },
        webhookUrl: IMAGE_WEBHOOK || undefined,
      }
    );

    return { requestId: request_id, responseUrl: response_url };
  }

  async generateImageSync(tensorPath: string) {
    const response = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt:
          "Generate a portrait on a clean white background for preview purposes",
        loras: [{ path: tensorPath, scale: 1 }],
      },
    });

    return response.data.images?.[0]?.url ?? "";
  }
}

