/**
 * Heuristics for runtime session context (continuity, known slots, intent shifts).
 * Shared by chat and legacy test stream so prompt behavior stays aligned.
 */

export type PromptHistoryMessage = {
  role: string;
  content: string;
};

export function inferKnownContext(allUserText: string): Record<string, string | boolean> {
  const t = allUserText.toLowerCase();
  const ctx: Record<string, string | boolean> = {};

  if (/\b(book|schedule|appointment|reschedule|cancel)\b/.test(t)) {
    ctx.intent = "scheduling";
  }
  if (/\bnew patient\b|\bfirst time\b/.test(t)) {
    ctx.isNewPatient = true;
  }
  if (/\bprimary care\b|\bpcp\b/.test(t)) {
    ctx.appointmentType = "primary care";
  } else if (/\bdoctor\b|\bdr\b|\bphysician\b/.test(t)) {
    ctx.appointmentType = "doctor visit";
  }
  if (/\bnext week\b/.test(t)) ctx.timePreference = "next week";
  if (/\btomorrow\b/.test(t)) ctx.timePreference = "tomorrow";
  if (/\b(morning|afternoon|evening)\b/.test(t)) {
    const match = t.match(/\b(morning|afternoon|evening)\b/);
    if (match?.[1]) ctx.timeOfDayPreference = match[1];
  }

  return ctx;
}

function inferIntent(text: string): "scheduling" | "rescheduling" | "cancelling" | undefined {
  if (/\bresched(ule|uling)?\b/.test(text)) return "rescheduling";
  if (/\bcancel(l|ling|lation)?\b/.test(text)) return "cancelling";
  if (/\b(book|schedule|appointment)\b/.test(text)) return "scheduling";
  return undefined;
}

export function inferIntentShiftNote(
  history: PromptHistoryMessage[],
  currentUserText: string
): string | undefined {
  const lastUser = [...history]
    .reverse()
    .find((m) => m.role === "user" && m.content && m.content.trim().length > 0);
  if (!lastUser) return undefined;
  const prev = lastUser.content.toLowerCase();
  const curr = currentUserText.toLowerCase();
  const prevIntent = inferIntent(prev);
  const currIntent = inferIntent(curr);
  if (!prevIntent || !currIntent || prevIntent === currIntent) return undefined;
  return `User switched intent from ${prevIntent} to ${currIntent}.`;
}

export function planNextQuestion(
  known: Record<string, string | boolean>,
  currentUserText: string
): string | undefined {
  const intent =
    inferIntent(currentUserText.toLowerCase()) ??
    (known.intent === "scheduling" ? "scheduling" : undefined);
  if (!intent) return undefined;

  if (intent === "scheduling") {
    if (!known.appointmentType) return "What type of appointment are you looking to schedule?";
    if (!known.timePreference) return "What day works best for you?";
    if (!known.timeOfDayPreference) return "Do you prefer morning, afternoon, or evening?";
    if (!("isNewPatient" in known)) return "Are you a new patient?";
    return "Would you like the first available appointment, or do you have a specific provider in mind?";
  }

  if (intent === "rescheduling") {
    return "What’s the date and time of the appointment you’d like to reschedule?";
  }

  if (intent === "cancelling") {
    return "What’s the date and time of the appointment you’d like to cancel?";
  }

  return undefined;
}

export function findConflictingNames(input: { assistantName: string; text: string }): string[] {
  const assistant = input.assistantName.trim().toLowerCase();
  const out = new Set<string>();
  const re = /\bthis is\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistant) continue;
    out.add(name);
  }
  const re2 = /\bI[' ]?m\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re2)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistant) continue;
    out.add(name);
  }
  return [...out];
}
