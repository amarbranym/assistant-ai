import type { Tool } from "ai";

/** How a tool surfaced to the model for this turn (for prompt injection + observability). */
export type RuntimeToolKind = "platform" | "custom_api" | "managed";

export type RuntimeToolManifestEntry = {
  kind: RuntimeToolKind;
  /** Model-facing tool name / key (e.g. getWeather, custom_api, managed_booking_abc). */
  id: string;
  /** Human-readable label for prompt text. */
  label: string;
  /** Short description of when/how to use; kept generic — mechanics live in tool schema. */
  usageSummary: string;
};

export type ResolvedAssistantRuntimeTools = {
  /** Pass through to AI SDK; omit or empty means no tools on the model. */
  tools: Record<string, Tool> | undefined;
  manifest: RuntimeToolManifestEntry[];
};

export type ResolveAssistantRuntimeToolsInput = {
  assistantConfig: Record<string, unknown>;
  conversationId: string;
  mode: "test" | "live";
  /** Optional injected tools (tests / future gateway). Merged last. */
  extraTools?: Record<string, Tool>;
};
