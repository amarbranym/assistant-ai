import type { Express } from "express";
import { Router } from "express";
import { assistantRoutes } from "./modules/assistant/assistant.routes";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";
import { chatRoutes } from "./modules/channels/chat/chat.routes";
import { conversationsRoutes } from "./modules/conversations/conversations.routes";
import { userRoutes } from "./modules/user/user.routes";
import { voiceRoutes } from "./modules/voice/voice.routes";

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use("/auth", userRoutes);
  v1.use("/assistants", assistantRoutes);
  v1.use("/analytics", analyticsRoutes);
  v1.use("/chat", chatRoutes);
  v1.use("/", conversationsRoutes);
  v1.use("/voice", voiceRoutes);

  app.use("/api/v1", v1);
}
