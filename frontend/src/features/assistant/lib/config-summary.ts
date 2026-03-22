function readConfigObject(config: unknown): Record<string, unknown> | null {
  if (config == null || config === "" || typeof config !== "object" || Array.isArray(config)) {
    return null;
  }
  return config as Record<string, unknown>;
}

/**
 * Short line for cards — backend stores rich config in `assistant.config` JSON.
 */
export function assistantConfigSummary(config: unknown): string {
  if (!readConfigObject(config)) {
    if (config == null || config === "") return "No assistant config yet";
    return "Configured";
  }
  const c = readConfigObject(config)!;
  const innerName = typeof c.name === "string" ? c.name : null;
  const model = c.model;
  let modelLabel: string | null = null;
  if (model && typeof model === "object" && !Array.isArray(model)) {
    const m = model as Record<string, unknown>;
    if (typeof m.model === "string") modelLabel = m.model;
  }
  const voice = c.voice;
  let voiceProvider: string | null = null;
  if (voice && typeof voice === "object" && !Array.isArray(voice)) {
    const v = voice as Record<string, unknown>;
    if (typeof v.provider === "string") voiceProvider = v.provider;
  }
  const parts = [innerName, modelLabel, voiceProvider].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Configured";
}

/** Display label for LLM row on assistant cards. */
export function assistantModelDisplay(config: unknown): string {
  const c = readConfigObject(config);
  if (!c) return "—";
  const model = c.model;
  if (model && typeof model === "object" && !Array.isArray(model)) {
    const m = model as Record<string, unknown>;
    const id = typeof m.model === "string" ? m.model : null;
    const provider = typeof m.provider === "string" ? m.provider : null;
    if (id && provider) return `${id} · ${provider}`;
    if (id) return id;
    if (provider) return provider;
  }
  return "—";
}

/** Display label for voice row on assistant cards. */
export function assistantVoiceDisplay(config: unknown): string {
  const c = readConfigObject(config);
  if (!c) return "—";
  const voice = c.voice;
  if (voice && typeof voice === "object" && !Array.isArray(voice)) {
    const v = voice as Record<string, unknown>;
    const provider = typeof v.provider === "string" ? v.provider : null;
    const model = typeof v.model === "string" ? v.model : null;
    if (provider && model) return `${provider} · ${model}`;
    if (provider) return provider;
    if (model) return model;
  }
  return "—";
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
