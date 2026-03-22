import { MOCK_ASSISTANTS } from "../data/mock-assistants";
import type {
  AssistantRecord,
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "../types/api-assistant";

/**
 * In-memory mock store (client-only). Replace with HTTP calls via `apiRequest`
 * when wiring the backend; keep the same function signatures from `assistants.api.ts`.
 */
let assistants: AssistantRecord[] = structuredClone(MOCK_ASSISTANTS);

function isoNow() {
  return new Date().toISOString();
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `asst_${Date.now()}`;
}

export async function listAssistantsMock(): Promise<AssistantRecord[]> {
  return Promise.resolve(assistants.map((a) => ({ ...a })));
}

export async function getAssistantByIdMock(
  id: string
): Promise<AssistantRecord | null> {
  const row = assistants.find((a) => a.id === id);
  return row ? { ...row } : null;
}

export async function createAssistantMock(
  input: CreateAssistantPayload
): Promise<AssistantRecord> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required");
  }
  const ts = isoNow();
  const row: AssistantRecord = {
    id: newId(),
    name,
    description: input.description?.trim() || null,
    projectId: input.projectId ?? null,
    config: input.config ?? {},
    active: true,
    createdAt: ts,
    updatedAt: ts,
  };
  assistants = [row, ...assistants];
  return { ...row };
}

export async function updateAssistantMock(
  id: string,
  input: UpdateAssistantPayload
): Promise<AssistantRecord> {
  const idx = assistants.findIndex((a) => a.id === id);
  if (idx === -1) {
    throw new Error("Assistant not found");
  }
  const prev = assistants[idx]!;
  const next: AssistantRecord = {
    ...prev,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() || null }
      : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    ...(input.config !== undefined ? { config: input.config } : {}),
    updatedAt: isoNow(),
  };
  assistants = assistants.map((a) => (a.id === id ? next : a));
  return { ...next };
}

export async function deleteAssistantMock(id: string): Promise<void> {
  const before = assistants.length;
  assistants = assistants.filter((a) => a.id !== id);
  if (assistants.length === before) {
    throw new Error("Assistant not found");
  }
}

/** For tests or Storybook resets only. */
export function resetAssistantsMock(): void {
  assistants = structuredClone(MOCK_ASSISTANTS);
}
