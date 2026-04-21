import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

function readKnowledgeAnalytics(config: unknown): {
  totalHits: number;
  lastSourceCountUsed: number;
  lastUsedAt: string | null;
} {
  const c = (config && typeof config === "object" ? (config as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;
  const analytics =
    c.analytics && typeof c.analytics === "object" ? (c.analytics as Record<string, unknown>) : {};
  const knowledge =
    analytics.knowledge && typeof analytics.knowledge === "object"
      ? (analytics.knowledge as Record<string, unknown>)
      : {};
  return {
    totalHits: typeof knowledge.totalHits === "number" ? knowledge.totalHits : 0,
    lastSourceCountUsed:
      typeof knowledge.lastSourceCountUsed === "number" ? knowledge.lastSourceCountUsed : 0,
    lastUsedAt: typeof knowledge.lastUsedAt === "string" ? knowledge.lastUsedAt : null
  };
}

export async function getOverview(userId: string) {
  const [assistantsCount, conversationsCount, messagesCount, callsCount, assistants] =
    await Promise.all([
      prisma.assistant.count({ where: { userId } }),
      prisma.conversation.count({ where: { assistant: { userId } } }),
      prisma.message.count({ where: { conversation: { assistant: { userId } } } }),
      prisma.call.count({ where: { assistant: { userId } } }),
      prisma.assistant.findMany({
        where: { userId },
        select: { id: true, name: true, config: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 50
      })
    ]);

  const knowledgeHitsTotal = assistants.reduce((acc, a) => acc + readKnowledgeAnalytics(a.config).totalHits, 0);

  return {
    assistantsCount,
    conversationsCount,
    messagesCount,
    callsCount,
    knowledgeHitsTotal
  };
}

export async function getAssistantAnalytics(userId: string, assistantId: string) {
  const assistant = await prisma.assistant.findFirst({
    where: { id: assistantId, userId },
    select: { id: true, name: true, config: true }
  });
  if (!assistant) return null;

  const [conversationsCount, messagesCount, callsCount] = await Promise.all([
    prisma.conversation.count({ where: { assistantId } }),
    prisma.message.count({ where: { conversation: { assistantId } } }),
    prisma.call.count({ where: { assistantId } })
  ]);

  const knowledge = readKnowledgeAnalytics(assistant.config);

  return {
    assistant: { id: assistant.id, name: assistant.name },
    conversationsCount,
    messagesCount,
    callsCount,
    knowledge
  };
}

