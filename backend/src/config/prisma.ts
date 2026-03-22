import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "./logger";

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.databaseUrl
        }
      }
    });

    logger.info("Prisma client initialized");

    process.on("beforeExit", async () => {
      if (prisma) {
        await prisma.$disconnect();
        logger.info("Prisma client disconnected");
      }
    });
  }

  return prisma;
}
