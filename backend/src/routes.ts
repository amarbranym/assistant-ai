import type { Express } from "express";
import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.routes";
import { assistantRoutes } from "./modules/assistant/assistant.routes";

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use("/auth", authRoutes);
  v1.use("/auth", userRoutes);
  v1.use("/assistants", assistantRoutes);

  app.use("/api/v1", v1);
}
