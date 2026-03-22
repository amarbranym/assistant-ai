import pino from "pino";
import { env } from "../env/env";

export const logger = pino({
  name: "assistant-ai-backend",
  level: env.logLevel,
  transport:
    env.nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      : undefined
});

export type Logger = typeof logger;
