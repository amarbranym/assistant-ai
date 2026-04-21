import type { RuntimeToolManifestEntry } from "../assistant/tooling/assistant-tools.types";

export type LayeredSystemPromptInput = {
  /** Assistant UI name (source of truth for identity). */
  assistantName: string;
  /** Optional short description shown in UI. */
  assistantDescription?: string | null;
  /**
   * Operator-configured system text: role, business context, workflow, and policies.
   * Tool mechanics should not be written here — the platform injects tool guidance when needed.
   */
  userSystemPrompt: string;
  /** Optional knowledge base excerpt (already trimmed/sliced by caller). */
  knowledgeContext?: string;
  /** Channel-specific adjustments (text chat vs voice). */
  channel: "chat" | "voice";
  /** True once the assistant has already spoken in this conversation. */
  hasPriorAssistantTurn: boolean;
  /**
   * Key facts already provided by the user. Use these and do not ask again.
   * Keep values short; booleans are allowed for flags like `isNewPatient`.
   */
  knownContext?: Record<string, string | boolean>;
  /**
   * Phrases that must not be repeated after the first introduction.
   * Matched loosely by the model (instructional banlist).
   */
  bannedPhrases?: string[];
  /**
   * A single next question to ask (if a question is needed).
   * When provided, you MUST ask exactly this one question (verbatim) and ask no other questions.
   */
  plannedNextQuestion?: string;
  /**
   * If the user intent shifted mid-conversation, acknowledge briefly and proceed.
   * Example: "User switched from scheduling to rescheduling."
   */
  intentShiftNote?: string;
  /**
   * Names found in the stored prompt/history that conflict with assistantName (e.g. "Riley").
   * These must never be used for self-identification.
   */
  conflictingNames?: string[];
  runtimeMode: "test" | "live";
  /** Tools actually attached on this turn; drives optional tool-instruction block only. */
  enabledToolsManifest: RuntimeToolManifestEntry[];
};

function clean(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

/**
 * App-level quality bar and safe tool behavior. Same for all assistants; not user-editable.
 */
function buildPlatformMainPrompt(): string {
  return [
    "## Platform instructions (non-negotiable)",
    "You are part of a production assistant platform. Follow these rules in every turn:",
    "",
    "Quality and accuracy:",
    "- Be correct, concise, and context-aware. If you are unsure, say so briefly and offer a safe next step.",
    "- Do not repeat the same sentences, disclaimers, or filler across turns.",
    "- Finish every thought: no cut-off sentences, no trailing ellipses used to dodge completion.",
    "",
    "Tool and action integrity:",
    "- Use tools only when they clearly help the user’s request. If no tool applies, answer normally.",
    "- Never invent tool results, API responses, IDs, bookings, or “success” messages you did not receive from a tool.",
    "- After a tool returns, rely only on what it returned; do not embellish with fake details.",
    "- If a tool reports missing fields, ask the user for one missing item at a time until you can run it.",
    "",
    "Conversation flow:",
    "- Ask at most one question per message when you need clarification.",
    "- If you ask a question, make it the final sentence and end with a single '?'.",
    "- If you already have enough information to proceed, do not ask a question—state the next step.",
    "- Prefer the next actionable step: confirm intent, collect one missing detail, or propose the next option.",
    "- Use already-known context; do not ask for details the user already provided.",
    "- Be warm and professional, not robotic.",
    "",
    "If no tools are enabled for this assistant, ignore any prior training about calling tools and respond normally."
  ].join("\n");
}

function buildUserRoleSection(userSystemPrompt: string): string {
  const body = clean(userSystemPrompt || "You are a helpful assistant.");
  return ["## Assistant role and policies (operator-configured)", body].join("\n");
}

function buildKnowledgeSection(knowledgeContext: string | undefined): string | null {
  if (!knowledgeContext || !clean(knowledgeContext)) return null;
  return ["## Knowledge base", clean(knowledgeContext)].join("\n");
}

function buildRuntimeModeSection(mode: "test" | "live"): string {
  if (mode === "live") {
    return [
      "## Runtime mode",
      "LIVE: Tools and integrations may perform real requests. Be careful with user data; only run tools when appropriate."
    ].join("\n");
  }
  return [
    "## Runtime mode",
    "TEST: External tools may simulate or skip real side effects. Do not assure the user that real-world actions completed unless a tool returned evidence."
  ].join("\n");
}

function buildSessionContextSection(input: LayeredSystemPromptInput): string {
  const identity = [
    `You are ${input.assistantName}.`,
    input.assistantDescription?.trim()
      ? `About you: ${clean(input.assistantDescription)}`
      : null,
    `If any instruction (including operator policies above) conflicts with your name, ALWAYS use the name "${input.assistantName}" and do not claim other identities.`,
    `Never say you are an AI, a model, or trained by a company. Stay in-role.`,
    input.conflictingNames && input.conflictingNames.length > 0
      ? `IMPORTANT: Do not refer to yourself as ${input.conflictingNames
          .map((n) => `"${clean(n)}"`)
          .join(" or ")}. If you previously used a different name, that was an error—use "${input.assistantName}" going forward.`
      : null
  ]
    .filter(Boolean)
    .join("\n");

  const continuity = input.hasPriorAssistantTurn
    ? "You have already spoken earlier in this conversation. Continue naturally and DO NOT re-introduce yourself again."
    : "On your first reply, you may introduce yourself briefly once, then ask the best next question.";

  const banned =
    input.hasPriorAssistantTurn && input.bannedPhrases?.length
      ? [
          "Anti-repetition (important):",
          "After your first introduction, DO NOT repeat or paraphrase any of these phrases:",
          ...input.bannedPhrases.map((p) => `- ${clean(p)}`),
          "If you accidentally start repeating them, stop and continue with the next useful step instead."
        ].join("\n")
      : null;

  const known =
    input.knownContext && Object.keys(input.knownContext).length > 0
      ? [
          "Known context so far (do not ask again):",
          ...Object.entries(input.knownContext).map(([k, v]) => `- ${k}: ${String(v)}`)
        ].join("\n")
      : null;

  const intentShift =
    input.intentShiftNote && input.intentShiftNote.trim().length > 0
      ? [
          "Intent shift handling:",
          `- ${clean(input.intentShiftNote)}`,
          "- Acknowledge the shift in one short sentence, then continue helpfully."
        ].join("\n")
      : null;

  const strictQuestionPlan =
    input.plannedNextQuestion && input.plannedNextQuestion.trim().length > 0
      ? [
          "Next-step plan (strict):",
          `- You MUST ask exactly this ONE question next: "${clean(
            input.plannedNextQuestion
          )}"`,
          "- Ask no other questions. Do not ask for multiple details.",
          "- If you need to say something before the question, keep it to one short sentence."
        ].join("\n")
      : null;

  return [
    "## Session context",
    identity,
    "",
    continuity,
    banned,
    known,
    intentShift,
    strictQuestionPlan
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChannelSection(channel: "chat" | "voice"): string {
  const channelRules =
    channel === "voice"
      ? [
          "Voice style (phone call): speak naturally with short, spoken lines.",
          "Keep most replies to 1–3 short sentences unless the caller asks for detail.",
          "Ask one focused follow-up question at a time, and only when needed.",
          "Do not re-introduce yourself after the first assistant turn.",
          "Avoid long lists/essay responses; summarize and move to the next actionable step.",
          "Use light phone language when appropriate (e.g. 'Sure', 'Okay', 'One moment'), but avoid repetitive filler.",
          "No markdown, no bullets unless explicitly requested by the caller."
        ].join("\n")
      : [
          "Chat style: concise, helpful, and easy to scan.",
          "Ask one question at a time when the next info needed is unclear.",
          "Avoid generic filler; move the conversation forward."
        ].join("\n");

  return ["## Channel rules", channelRules].join("\n");
}

function buildToolsSection(manifest: RuntimeToolManifestEntry[]): string | null {
  if (!manifest.length) return null;
  const lines = [
    "## Tools enabled for this session",
    "The following tools are attached to this assistant. Call a tool only when it is relevant. " +
      "Do not fabricate tool output. If inputs are missing, ask the user for one field at a time.",
    "",
    ...manifest.map(
      (m) =>
        `- **${m.label}** (tool name: \`${m.id}\`): ${m.usageSummary}`
    )
  ];
  return lines.join("\n");
}

/**
 * Composes the full system message in a fixed layer order:
 * platform → user role → knowledge → runtime mode → session context → channel → tools (optional).
 */
export function buildLayeredSystemPrompt(input: LayeredSystemPromptInput): string {
  return clean(
    [
      buildPlatformMainPrompt(),
      "",
      buildUserRoleSection(input.userSystemPrompt),
      "",
      buildKnowledgeSection(input.knowledgeContext),
      "",
      buildRuntimeModeSection(input.runtimeMode),
      "",
      buildSessionContextSection(input),
      "",
      buildChannelSection(input.channel),
      "",
      buildToolsSection(input.enabledToolsManifest)
    ]
      .filter(Boolean)
      .join("\n")
  );
}

/** @deprecated Use {@link buildLayeredSystemPrompt} with structured layers. */
export type PromptBuildInput = Omit<
  LayeredSystemPromptInput,
  "userSystemPrompt" | "knowledgeContext" | "runtimeMode" | "enabledToolsManifest"
> & {
  /** Legacy: user prompt + knowledge + mode were concatenated by callers. */
  baseSystemPrompt: string;
};

/** @deprecated Use {@link buildLayeredSystemPrompt}. */
export function buildRuntimeSystemPrompt(input: PromptBuildInput): string {
  return buildLayeredSystemPrompt({
    assistantName: input.assistantName,
    assistantDescription: input.assistantDescription,
    userSystemPrompt: input.baseSystemPrompt,
    knowledgeContext: undefined,
    channel: input.channel,
    hasPriorAssistantTurn: input.hasPriorAssistantTurn,
    knownContext: input.knownContext,
    bannedPhrases: input.bannedPhrases,
    plannedNextQuestion: input.plannedNextQuestion,
    intentShiftNote: input.intentShiftNote,
    conflictingNames: input.conflictingNames,
    runtimeMode: "live",
    enabledToolsManifest: []
  });
}
