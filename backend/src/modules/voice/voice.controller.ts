import type { NextFunction, Response } from "express";
import { z } from "zod";

import type { RequestWithUser } from "../../common/interfaces/request.interface";
import { ok } from "../../common/response/apiResponse";
import * as voiceService from "./voice.service";
import {
  createElevenLabsCustomVoice,
  listElevenLabsVoices,
  streamElevenLabsSpeech
} from "./providers/elevenlabs.provider";

const createSessionSchema = z.object({
  assistantId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  sampleRate: z.number().int().min(8000).max(48000).optional(),
  mode: z.enum(["test", "live"]).optional()
});

export async function createSession(
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
) {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues
      }
    });
  }

  const body = parsed.data;
  const assistant = await voiceService.getAssistantForVoiceSession({
    assistantId: body.assistantId,
    userId: req.user!.id
  });
  const conversation = await voiceService.getOrCreateConversationForVoice({
    assistantId: assistant.id,
    conversationId: body.conversationId
  });
  const session = voiceService.createVoiceSessionState({
    userId: req.user!.id,
    assistant,
    conversationId: conversation.id,
    sampleRate: body.sampleRate,
    mode: body.mode ?? "test"
  });

  return ok(res, {
    sessionId: session.sessionId,
    conversationId: conversation.id,
    assistantId: assistant.id,
    mode: session.mode,
    websocketPath: `/api/v1/voice/realtime?assistantId=${assistant.id}&conversationId=${conversation.id}`
  });
}

export async function listVoices(_req: RequestWithUser, res: Response) {
  const voices = await listElevenLabsVoices();
  return ok(res, { voices });
}

const previewVoiceSchema = z.object({
  voiceId: z.string().min(1),
  text: z.string().min(1).max(220).optional()
});

export async function previewVoice(req: RequestWithUser, res: Response) {
  const parsed = previewVoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.issues }
    });
  }

  const chunks: Buffer[] = [];
  await streamElevenLabsSpeech({
    voiceId: parsed.data.voiceId,
    modelId: "eleven_turbo_v2_5",
    text:
      parsed.data.text?.trim() ||
      "Hello! This is your assistant voice preview from ElevenLabs.",
    onChunk: (chunk) => {
      chunks.push(chunk);
    }
  });

  const audio = Buffer.concat(chunks).toString("base64");
  return ok(res, { mimeType: "audio/mpeg", audio });
}

const uploadCustomVoiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  audioBase64: z.string().min(1)
});

export async function uploadCustomVoice(req: RequestWithUser, res: Response) {
  const parsed = uploadCustomVoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.issues }
    });
  }
  const created = await createElevenLabsCustomVoice(parsed.data);
  return ok(res, created);
}

