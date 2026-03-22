import { getPrismaClient } from "../../config/clients/prisma.client";
import type { Prisma } from "@prisma/client";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";

const prisma = getPrismaClient();

export async function createAssistant(data: CreateAssistantDTO) {
  return prisma.assistant.create({
    data: {
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      config: data.config
        ? (JSON.parse(JSON.stringify(data.config)) as Prisma.InputJsonValue)
        : undefined,
      active: true
    }
  });
}

export async function getAssistantById(id: string) {
  return prisma.assistant.findUnique({ where: { id } });
}

export async function listAssistants(filters?: { projectId?: string; activeOnly?: boolean }) {
  return prisma.assistant.findMany({
    where: {
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.activeOnly ? { active: true } : {})
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateAssistant(id: string, data: UpdateAssistantDTO) {
  return prisma.assistant.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId ?? null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.config !== undefined
        ? { config: JSON.parse(JSON.stringify(data.config)) as Prisma.InputJsonValue }
        : {})
    }
  });
}

export async function deleteAssistant(id: string) {
  await prisma.assistant.delete({ where: { id } });
}
