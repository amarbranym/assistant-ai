/**
 * Assistant API surface for the app layer.
 *
 * Today: delegates to the in-memory mock repository (no network).
 * Next: replace implementations with `apiRequest` + `/api/v1/assistants` while
 * keeping these function signatures so hooks stay unchanged.
 */
import {
  createAssistantMock,
  deleteAssistantMock,
  getAssistantByIdMock,
  listAssistantsMock,
  updateAssistantMock,
} from "./assistants-mock.repository";
import type {
  AssistantRecord,
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "../types/api-assistant";

export async function fetchAssistants(): Promise<AssistantRecord[]> {
  return listAssistantsMock();
}

export async function fetchAssistant(id: string): Promise<AssistantRecord> {
  const row = await getAssistantByIdMock(id);
  if (!row) throw new Error("Assistant not found");
  return row;
}

export async function createAssistant(
  input: CreateAssistantPayload
): Promise<AssistantRecord> {
  return createAssistantMock(input);
}

export async function updateAssistant(
  id: string,
  input: UpdateAssistantPayload
): Promise<AssistantRecord> {
  return updateAssistantMock(id, input);
}

export async function deleteAssistant(id: string): Promise<void> {
  return deleteAssistantMock(id);
}
