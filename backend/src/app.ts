import "./common/interfaces/request.interface";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { json } from "express";
import { logger } from "./config/logger";
import { env, checkProviderConfig } from "./config/env";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";

function buildCorsOptions(): cors.CorsOptions {
  const allowed = new Set(env.corsAllowedOrigins);
  return {
    origin(requestOrigin, callback) {
      // Non-browser (curl/server-to-server) requests have no Origin header — allow.
      if (!requestOrigin) return callback(null, true);
      if (allowed.has(requestOrigin) || allowed.has("*")) {
        return callback(null, true);
      }
      if (env.corsAllowedOrigins.length === 0 && env.nodeEnv !== "production") {
        // Dev safety net: if operator forgot to set the env, don't 500 — warn.
        logger.warn({ origin: requestOrigin }, "CORS: empty allowlist, rejecting browser origin");
      }
      return callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
    },
    credentials: true,
    exposedHeaders: ["x-request-id"]
  };
}

export const createApp = async () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(json({ limit: "1mb" }));

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

  checkProviderConfig(logger);
  logger.info(
    {
      corsAllowedOrigins: env.corsAllowedOrigins,
      allowDevAuthFallback: env.allowDevAuthFallback
    },
    "Express app initialized"
  );

  return app;
};
