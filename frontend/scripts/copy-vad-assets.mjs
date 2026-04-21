#!/usr/bin/env node
// Copies the Silero VAD assets from @ricky0123/vad-web + onnxruntime-web into
// `public/vad/` so they are served at `/vad/*` and the browser-side VAD can load
// them without depending on an external CDN.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = resolve(__dirname, "..");

const outDir = join(frontendRoot, "public", "vad");
const vadWebDist = join(frontendRoot, "node_modules", "@ricky0123", "vad-web", "dist");
const ortWebDist = join(frontendRoot, "node_modules", "onnxruntime-web", "dist");

const vadWebFiles = [
  "vad.worklet.bundle.min.js",
  "silero_vad_legacy.onnx",
  "silero_vad_v5.onnx"
];

if (!existsSync(vadWebDist)) {
  console.error(`[copy-vad-assets] Missing ${vadWebDist}. Run \`npm install\` first.`);
  process.exit(1);
}
if (!existsSync(ortWebDist)) {
  console.error(`[copy-vad-assets] Missing ${ortWebDist}. Run \`npm install\` first.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

let copied = 0;

for (const file of vadWebFiles) {
  const src = join(vadWebDist, file);
  if (!existsSync(src)) {
    console.warn(`[copy-vad-assets] skip (missing): ${src}`);
    continue;
  }
  cpSync(src, join(outDir, file));
  copied += 1;
}

// All .wasm and .mjs files from onnxruntime-web/dist (required at runtime).
for (const entry of readdirSync(ortWebDist)) {
  if (!entry.endsWith(".wasm") && !entry.endsWith(".mjs")) continue;
  const src = join(ortWebDist, entry);
  if (!statSync(src).isFile()) continue;
  cpSync(src, join(outDir, entry));
  copied += 1;
}

console.log(`[copy-vad-assets] Copied ${copied} file(s) → ${outDir}`);
