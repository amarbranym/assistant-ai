import { z } from "zod";

import {
  SUPABASE_PLACEHOLDER_ANON_KEY,
  SUPABASE_PLACEHOLDER_URL,
} from "@/lib/supabase/config";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    (v) =>
      typeof v === "string" && v.trim() !== ""
        ? v
        : SUPABASE_PLACEHOLDER_URL,
    z.string().url()
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    (v) =>
      typeof v === "string" && v.trim() !== "" ? v : SUPABASE_PLACEHOLDER_ANON_KEY,
    z.string().min(1)
  ),
  NEXT_PUBLIC_API_URL: z.preprocess(
    (v) =>
      typeof v === "string" && v.trim() !== "" ? v : "http://localhost:4000",
    z.string().url()
  ),
  /** Sent as `x-api-key`; backend grants access when present. */
  NEXT_PUBLIC_API_KEY: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v : "dev"),
    z.string().min(1)
  ),
  /** Console logging for the realtime voice client (see useAssistantVoiceSession). */
  NEXT_PUBLIC_VOICE_DEBUG: z.boolean(),
  /** Kill switch for the Silero (`@ricky0123/vad-web`) client-side VAD. Set to "true" to
   *  completely disable the hook (e.g. while debugging an audio-pipeline regression). */
  NEXT_PUBLIC_DISABLE_SILERO_VAD: z.boolean(),
  /**
   * When true, request the mic with echoCancellation/noiseSuppression off.
   * Some Windows drivers + aggressive AEC feed all-zero samples into WebAudio;
   * toggling this is the fastest way to confirm.
   */
  NEXT_PUBLIC_VOICE_DISABLE_AEC: z.boolean(),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  NEXT_PUBLIC_VOICE_DEBUG:
    process.env.NEXT_PUBLIC_VOICE_DEBUG === "true" ||
    process.env.NEXT_PUBLIC_VOICE_DEBUG === "1",
  NEXT_PUBLIC_DISABLE_SILERO_VAD:
    process.env.NEXT_PUBLIC_DISABLE_SILERO_VAD === "true" ||
    process.env.NEXT_PUBLIC_DISABLE_SILERO_VAD === "1",
  NEXT_PUBLIC_VOICE_DISABLE_AEC:
    process.env.NEXT_PUBLIC_VOICE_DISABLE_AEC === "true" ||
    process.env.NEXT_PUBLIC_VOICE_DISABLE_AEC === "1",
});
