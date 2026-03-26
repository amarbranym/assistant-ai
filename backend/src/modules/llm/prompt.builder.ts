export type PromptBuildInput = {
  /** Assistant UI name (source of truth for identity). */
  assistantName: string;
  /** Optional short description shown in UI. */
  assistantDescription?: string | null;
  /** The user-authored system prompt stored on the assistant. */
  baseSystemPrompt: string;
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
};

function clean(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

export function buildRuntimeSystemPrompt(input: PromptBuildInput): string {
  const base = clean(input.baseSystemPrompt || "You are a helpful assistant.");

  const identity = [
    `You are ${input.assistantName}.`,
    input.assistantDescription?.trim()
      ? `About you: ${clean(input.assistantDescription)}`
      : null,
    `If any instruction (including the base prompt) conflicts with your name, ALWAYS use the name "${input.assistantName}" and do not claim other identities.`,
    `Never say you are an AI, a model, or trained by a company. Stay in-role.`,
    input.conflictingNames && input.conflictingNames.length > 0
      ? `IMPORTANT: Do not refer to yourself as ${input.conflictingNames
          .map((n) => `"${clean(n)}"`)
          .join(" or ")}. If you previously used a different name, that was an error—use "${input.assistantName}" going forward.`
      : null
  ]
    .filter(Boolean)
    .join("\n");

  const channelRules =
    input.channel === "voice"
      ? [
          "Voice style: short sentences, natural phrasing, no markdown, no bullet lists unless asked.",
          "Ask one question at a time when you need info.",
          "Avoid long monologues; keep turns quick and action-oriented."
        ].join("\n")
      : [
          "Chat style: concise, helpful, and easy to scan.",
          "Ask one question at a time when the next info needed is unclear.",
          "Avoid generic filler; move the conversation forward."
        ].join("\n");

  const oneQuestionRule = [
    "Question discipline:",
    "- Ask AT MOST ONE question per message.",
    "- If you ask a question, make it the final sentence and end with a single '?'.",
    "- If you already have enough info to proceed, do NOT ask a question; state the next step."
  ].join("\n");

  const completionRules = [
    "Response completeness:",
    "- Always finish your last sentence. Do not cut off mid-sentence.",
    "- Avoid trailing ellipses and unfinished thoughts."
  ].join("\n");

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

  const intentShift =
    input.intentShiftNote && input.intentShiftNote.trim().length > 0
      ? [
          "Intent shift handling:",
          `- ${clean(input.intentShiftNote)}`,
          "- Acknowledge the shift in one short sentence, then continue with the next-step plan."
        ].join("\n")
      : null;

  const behaviorRules = [
    "Conversation rules:",
    "- Do not repeat your greeting or self-introduction on every turn.",
    "- Avoid scripted phrases; be natural and concise.",
    "- If the user greets (e.g. 'hi', 'hello'), respond briefly and immediately ask the most relevant next question.",
    "- If the user gives short answers like 'yes'/'no' and the context is unclear, ask one clarifying question that makes progress.",
    "- Prefer the next actionable step: confirm intent, ask for one missing detail, or propose the next option.",
    "- Use already-known context; do not ask for details the user already provided.",
    "- Be warm and professional, not robotic."
  ].join("\n");

  const continuity = input.hasPriorAssistantTurn
    ? "You have already spoken earlier in this conversation. Continue naturally without re-introducing yourself."
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

  return clean(
    [
      base,
      "",
      "## Runtime identity",
      identity,
      "",
      "## Runtime behavior",
      behaviorRules,
      oneQuestionRule,
      completionRules,
      continuity,
      banned,
      known,
      intentShift,
      strictQuestionPlan,
      "",
      "## Channel rules",
      channelRules
    ]
      .filter(Boolean)
      .join("\n")
  );
}

