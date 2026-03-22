import {
  createAssistant as createRepo,
  deleteAssistant as deleteRepo,
  getAssistantById,
  listAssistants,
  updateAssistant as updateRepo
} from "./assistant.repository";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";

export async function createAssistant(payload: CreateAssistantDTO) {
  return createRepo(payload);
}

export async function getAssistant(id: string) {
  return getAssistantById(id);
}

export async function getAssistants(filters?: { projectId?: string; activeOnly?: boolean }) {
  return listAssistants(filters);
}

export async function updateAssistant(id: string, payload: UpdateAssistantDTO) {
  return updateRepo(id, payload);
}

export async function removeAssistant(id: string) {
  await deleteRepo(id);
}
