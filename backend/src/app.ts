import express from "express";
import cors from "cors";
import helmet from "helmet";
import { json } from "express";
import { logger } from "./config/clients/logger";
import { env } from "./config/env/env";
import { registerEndpoints } from "./endpoint-loader";
import { errorHandler } from "./shared/middleware/error.middleware";

export const createApp = async () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: "*"
    })
  );
  app.use(json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      env: env.nodeEnv
    });
  });

  // Versioned API health check (matches /api/v1 prefix)
  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      env: env.nodeEnv
    });
  });

  await registerEndpoints(app);

  app.use(errorHandler);

  logger.info("Express app initialized");

  return app;
};

