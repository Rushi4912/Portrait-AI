import pino from "pino";
import { env } from "../config/env";

const prettyTransport =
  env.NODE_ENV === "development" && hasPrettyTransport()
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
        },
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "portrait-ai-backend" },
  transport: prettyTransport,
});

function hasPrettyTransport() {
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    console.warn(
      "ℹ️ pino-pretty not installed; logs will remain JSON formatted. Install it for prettier dev logs."
    );
    return false;
  }
}

export type Logger = typeof logger;

