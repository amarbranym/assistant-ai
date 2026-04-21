import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

export async function listConversationsForAssistant(input: {
  userId: string;
  assistantId: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(100, input.limit ?? 20));
  const assistant = await prisma.assistant.findFirst({
    where: { id: input.assistantId, userId: input.userId },
    select: { id: true }
  });
  if (!assistant) return null;

  const rows = await prisma.conversation.findMany({
    where: { assistantId: input.assistantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      messages: { select: { id: true }, take: 1 }
    }
  });

  // message count efficiently
  const ids = rows.map((r) => r.id);
  const counts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: ids } },
    _count: { _all: true }
  });
  const countMap = new Map(counts.map((c) => [c.conversationId, c._count._all]));

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    messageCount: countMap.get(r.id) ?? 0
  }));
}

export async function getConversationTranscript(input: {
  userId: string;
  assistantId: string;
  conversationId: string;
}) {
  const assistant = await prisma.assistant.findFirst({
    where: { id: input.assistantId, userId: input.userId },
    select: { id: true }
  });
  if (!assistant) return null;

  const convo = await prisma.conversation.findFirst({
    where: { id: input.conversationId, assistantId: input.assistantId },
    select: {
      id: true,
      createdAt: true,
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true } }
    }
  });
  return convo;
}

