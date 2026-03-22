import "./common/interfaces/request.interface";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { json } from "express";
import { logger } from "./config/logger";
import { env } from "./config/env";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

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

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      env: env.nodeEnv
    });
  });

  registerRoutes(app);

  app.use(errorHandler);

  logger.info("Express app initialized");

  return app;
};
