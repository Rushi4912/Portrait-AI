import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prismaClient } from "./lib/prisma";
import { initSentry, sentryRequestHandler, sentryErrorHandler } from "./lib/sentry";
import { apiLimiter } from "./middleware/rateLimiter";
import { notFoundHandler, errorHandler } from "./middleware/error-handler";
import { aiRouter } from "./routes/ai.routes";
import { storyRouter } from "./routes/story.routes";
import { storybookRouter } from "./routes/storybook.routes";
import { paymentRouter } from "./routes/payment.routes";
import { webhookRouter } from "./routes/webhook.routes";
import { falAiWebhookRouter } from "./routes/fal-ai-webhook.routes";

initSentry();

export function createApp() {
  const app = express();

  app.use(sentryRequestHandler());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
    })
  );
  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(apiLimiter);

  app.get("/healthz", async (_req, res) => {
    try {
      // Test database connection
      await prismaClient.$queryRaw`SELECT 1`;
      res.json({ 
        status: "ok", 
        env: env.NODE_ENV,
        database: "connected"
      });
    } catch (error) {
      logger.error({ error }, "Health check failed - database not connected");
      res.status(503).json({ 
        status: "error", 
        env: env.NODE_ENV,
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.use("/api/webhook", webhookRouter);
  app.use("/fal-ai/webhook", falAiWebhookRouter);
  app.use(aiRouter);
  app.use("/story", storyRouter);
  app.use("/storybook", storybookRouter);
  app.use("/payment", paymentRouter);

  app.use(notFoundHandler);
  app.use(sentryErrorHandler());
  app.use(errorHandler);

  return app;
}

