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
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
});
