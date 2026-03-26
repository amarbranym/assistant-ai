import type { Express } from "express";
import { Router } from "express";
import { assistantRoutes } from "./modules/assistant/assistant.routes";
import { chatRoutes } from "./modules/channels/chat/chat.routes";
import { userRoutes } from "./modules/user/user.routes";

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use("/auth", userRoutes);
  v1.use("/assistants", assistantRoutes);
  v1.use("/chat", chatRoutes);

  app.use("/api/v1", v1);
}
