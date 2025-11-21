import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

export function startServer() {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  server.on("error", (error) => {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  });
}

