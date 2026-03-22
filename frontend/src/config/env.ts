import { z } from "zod";

const schema = z.object({
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
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
});
