/*
  Warnings:

  - You are about to drop the column `config` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `callId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Call` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstMessageMode` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemPrompt` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversationId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "FirstMessageMode" AS ENUM ('assistant_speak_first', 'assistant_wait_for_user', 'auto_generated');

-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('webhook', 'api', 'workflow');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_callId_fkey";

-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "config",
DROP COLUMN "description",
ADD COLUMN     "firstMessage" TEXT,
ADD COLUMN     "firstMessageMode" "FirstMessageMode" NOT NULL,
ADD COLUMN     "maxTokens" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "systemPrompt" TEXT NOT NULL,
ADD COLUMN     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "callId",
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "conversationId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropTable
DROP TABLE "AnalyticsEvent";

-- DropTable
DROP TABLE "Call";

-- DropTable
DROP TABLE "Channel";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,

    CONSTRAINT "VoiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSettings" (
    "id" TEXT NOT NULL,
    "punctuationBoundaries" TEXT[],
    "inputMinCharacters" INTEGER NOT NULL DEFAULT 20,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "claritySimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "styleExaggeration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "optimizeStreamingLatency" TEXT,
    "speakerBoost" BOOLEAN NOT NULL DEFAULT true,
    "autoMode" BOOLEAN NOT NULL DEFAULT true,
    "backgroundSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backgroundSoundType" TEXT NOT NULL DEFAULT 'default',
    "backgroundSoundUrl" TEXT,
    "assistantId" TEXT NOT NULL,

    CONSTRAINT "VoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ToolType" NOT NULL,
    "description" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL,
    "headers" JSONB,
    "body" JSONB,
    "assistantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceConfig_assistantId_key" ON "VoiceConfig"("assistantId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceSettings_assistantId_key" ON "VoiceSettings"("assistantId");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceConfig" ADD CONSTRAINT "VoiceConfig_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSettings" ADD CONSTRAINT "VoiceSettings_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
