import { getPrismaClient } from "../../lib/prismaClient";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";
import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";

const prisma = getPrismaClient();

function toInputJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const assistantCompatSelect = {
  id: true,
  name: true,
  description: true,
  projectId: true,
  config: true,
  active: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createAssistant(userId: string, data: CreateAssistantDTO) {
  return prisma.assistant.create({
    data: {
      user: { connect: { id: userId } },
      name: data.name,
      description: data.description ?? null,
      config: toInputJsonValue(data.config ?? {}),
      ...(data.projectId ? { project: { connect: { id: data.projectId } } } : {}),
      active: true,
    },
    select: assistantCompatSelect,
  });
}

export async function getAssistantByIdForUser(id: string, userId: string) {
  return prisma.assistant.findFirst({
    where: { id, userId },
    select: assistantCompatSelect,
  });
}

export async function listAssistantsForUser(
  userId: string,
  filters?: {
    projectId?: string;
    activeOnly?: boolean;
  }
) {
  return prisma.assistant.findMany({
    where: {
      userId,
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.activeOnly ? { active: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: assistantCompatSelect,
  });
}

export async function updateAssistant(
  id: string,
  userId: string,
  data: UpdateAssistantDTO
) {
  const result = await prisma.assistant.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.config !== undefined
        ? { config: toInputJsonValue(data.config) }
        : {}),
      ...(data.projectId !== undefined
        ? data.projectId === null
          ? { projectId: null }
          : { projectId: data.projectId }
        : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
  if (result.count === 0) return null;
  return prisma.assistant.findFirst({
    where: { id, userId },
    select: assistantCompatSelect,
  });
}

export async function deleteAssistant(id: string, userId: string): Promise<boolean> {
  const result = await prisma.assistant.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export async function getRecentMessages({
  conversationId,
  limit = 10
}: {
  conversationId: string;
  limit?: number;
}) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit
  });
}

export async function saveMessage({
  conversationId,
  role,
  content
}: {
  conversationId: string;
  role: Role;
  content: string;
}) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content
    }
  });
}
