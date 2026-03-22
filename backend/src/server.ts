import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { registerVoiceWebsocket } from "./realtime/voice-ws";

async function bootstrap() {
  try {
    const app = await createApp();
    const server = createServer(app);
    registerVoiceWebsocket(server);

    server.listen(env.port, () => {
      logger.info(
        { port: env.port, env: env.nodeEnv },
        "assistant.ai backend server listening"
      );
    });
  } catch (err) {
    logger.error({ err }, "Failed to bootstrap server");
    process.exit(1);
  }
}

bootstrap();

