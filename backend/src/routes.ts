import type { Express } from "express";
import { Router } from "express";
import { assistantRoutes } from "./modules/assistant/assistant.routes";
import { userRoutes } from "./modules/user/user.routes";

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use("/auth", userRoutes);
  v1.use("/assistants", assistantRoutes);

  app.use("/api/v1", v1);
}
