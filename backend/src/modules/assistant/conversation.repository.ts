import { PrismaClient } from "@prisma/client";

// Get the prisma client from our central config if possible, 
// for now we instantiate a localized one or assume it's imported correctly.
// Assuming central client is in src/config/clients/prisma.client.ts or similar.
// Since we don't know the exact path yet, we'll initialize here. 
// A better practice is to import from the shared client.
const prisma = new PrismaClient();

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { messages: true }
  });
}

export async function createConversation(assistantId: string) {
  return prisma.conversation.create({
    data: { assistantId }
  });
}

export async function getRecentMessages({
  conversationId,
  limit = 10
}: {
  conversationId: string;
  limit?: number;
}) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit
  });

  return messages;
}

export async function saveMessage({
  conversationId,
  role,
  content
}: {
  conversationId: string;
  role: "system" | "user" | "assistant" | "tool" | "data";
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
