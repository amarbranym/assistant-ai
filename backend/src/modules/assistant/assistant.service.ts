import type { ModelMessage } from "ai";
import { randomUUID } from "crypto";
import {
  createAssistant as createRepo,
  deleteAssistant as deleteRepo,
  getAssistantByIdForUser,
  getRecentMessages,
  listAssistantsForUser,
  saveMessage,
  updateAssistant as updateRepo
} from "./assistant.repository";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";
import { getEnabledTools } from "./tools.registry";
import { buildCustomApiTool } from "./custom-api.tool";
import { buildManagedIntegrationTools } from "./managed-tools.tool";
import { resolveLlmConfigFromAssistantConfig, streamTextResponseSafe } from "../llm/llm.service";
import { buildRuntimeSystemPrompt } from "../llm/prompt.builder";
import type { Role } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";

export type KnowledgeSource = {
  id: string;
  type: "url" | "text" | "file";
  name: string;
  content?: string;
  enabled: boolean;
  status: "processing" | "ready" | "failed";
  lastUpdatedAt?: string;
};

type PublishCheck = {
  key: string;
  label: string;
  passed: boolean;
  message: string;
};

function deriveKnowledgeStatus(source: KnowledgeSource): "ready" | "failed" {
  const content = (source.content ?? "").trim();
  if (source.type === "url") {
    try {
      const url = new URL(content);
      return url.protocol === "http:" || url.protocol === "https:" ? "ready" : "failed";
    } catch {
      return "failed";
    }
  }
  return content.length > 0 ? "ready" : "failed";
}

function toolsFromConfig(config: Record<string, unknown>): string[] {
  const raw = config.tools;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }
  return [];
}

function readKnowledgeSources(config: Record<string, unknown>): KnowledgeSource[] {
  const knowledge =
    config.knowledge && typeof config.knowledge === "object"
      ? (config.knowledge as Record<string, unknown>)
      : {};
  const sources = Array.isArray(knowledge.sources) ? knowledge.sources : [];
  return sources
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
    .map((s) => ({
      id: typeof s.id === "string" ? s.id : randomUUID(),
      type: s.type === "url" || s.type === "text" || s.type === "file" ? s.type : "text",
      name: typeof s.name === "string" ? s.name : "Untitled source",
      content: typeof s.content === "string" ? s.content : undefined,
      enabled: typeof s.enabled === "boolean" ? s.enabled : true,
      status: s.status === "processing" || s.status === "ready" || s.status === "failed" ? s.status : "ready",
      lastUpdatedAt: typeof s.lastUpdatedAt === "string" ? s.lastUpdatedAt : undefined
    }));
}

function withKnowledgeSources(
  config: Record<string, unknown>,
  sources: KnowledgeSource[]
): Record<string, unknown> {
  const knowledge =
    config.knowledge && typeof config.knowledge === "object"
      ? (config.knowledge as Record<string, unknown>)
      : {};
  return {
    ...config,
    knowledge: {
      ...knowledge,
      enabled: sources.some((s) => s.enabled),
      sources
    }
  };
}

export async function createAssistant(userId: string, payload: CreateAssistantDTO) {
  return createRepo(userId, payload);
}

export async function getAssistant(id: string, userId: string) {
  return getAssistantByIdForUser(id, userId);
}

export async function getAssistants(
  userId: string,
  filters?: {
    projectId?: string;
    activeOnly?: boolean;
  }
) {
  return listAssistantsForUser(userId, filters);
}

export async function updateAssistant(
  id: string,
  userId: string,
  payload: UpdateAssistantDTO
) {
  return updateRepo(id, userId, payload);
}

export async function removeAssistant(id: string, userId: string) {
  return deleteRepo(id, userId);
}

export async function processChat({
  assistantId,
  conversationId,
  input,
  userId,
  mode = "test"
}: {
  assistantId: string;
  conversationId: string;
  input: string;
  userId: string;
  mode?: "test" | "live";
}) {
  const assistant = await getAssistantByIdForUser(assistantId, userId);
  if (!assistant) throw new Error("Assistant not found");
  if (mode === "live" && !assistant.active) {
    throw new AppError(403, "Assistant is inactive. Enable it before using live mode.", "ASSISTANT_INACTIVE");
  }

  const config = assistant.config as Record<string, unknown>;
  const knowledgeSources = readKnowledgeSources(config).filter(
    (s) => s.enabled && s.status === "ready" && s.content?.trim()
  );
  const knowledgeContext =
    knowledgeSources.length > 0
      ? `\n\nKnowledge context:\n${knowledgeSources
          .slice(0, 8)
          .map((s) => `- ${s.name}: ${(s.content ?? "").slice(0, 600)}`)
          .join("\n")}`
      : "";
  const enabled = mode === "live" ? getEnabledTools(toolsFromConfig(config)) : undefined;
  const customApi = buildCustomApiTool({ assistant, conversationId, mode });
  const managedTools = buildManagedIntegrationTools({ assistant, conversationId, mode });
  const tools = {
    ...(enabled ?? {}),
    ...managedTools,
    ...(customApi ? { custom_api: customApi } : {})
  };
  const history = await getRecentMessages({ conversationId, limit: 10 });

  const hasPriorAssistantTurn = history.some((m) => m.role === "assistant");
  const llmConfig = resolveLlmConfigFromAssistantConfig(config, { tools });
  const conflictingNames = findConflictingNames({
    assistantName: assistant.name,
    text: llmConfig.systemPrompt
  });
  const bannedPhrases = hasPriorAssistantTurn
    ? [
        "Thank you for calling",
        "This is",
        `This is ${assistant.name}`,
        ...conflictingNames.map((n) => `This is ${n}`),
        ...conflictingNames
      ]
    : [];
  const plannedNextQuestion = undefined;
  const runtimeSystemPrompt = buildRuntimeSystemPrompt({
    assistantName: assistant.name,
    assistantDescription: assistant.description ?? null,
    baseSystemPrompt: `${llmConfig.systemPrompt}${knowledgeContext}${
      mode === "live"
        ? "\n\nRuntime mode: LIVE. Actions may execute for real users."
        : "\n\nRuntime mode: TEST. Never claim that tools/actions were actually executed in external systems."
    }`,
    channel: "chat",
    hasPriorAssistantTurn,
    bannedPhrases,
    plannedNextQuestion,
    conflictingNames
  });

  const messages: ModelMessage[] = [
    { role: "system", content: runtimeSystemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    })),
    { role: "user", content: input }
  ];

  saveMessage({ conversationId, role: "user" satisfies Role, content: input }).catch(
    () => {}
  );

  return streamTextResponseSafe({
    config: llmConfig,
    messages,
    onFinish: async ({ text }) => {
      if (text) {
        await saveMessage({
          conversationId,
          role: "assistant" satisfies Role,
          content: text
        }).catch(() => {});
      }
    }
  });
}

export async function listKnowledgeSources(input: { assistantId: string; userId: string }) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new Error("Assistant not found");
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  return readKnowledgeSources(config);
}

export async function addKnowledgeSource(input: {
  assistantId: string;
  userId: string;
  source: Omit<KnowledgeSource, "lastUpdatedAt">;
}) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new Error("Assistant not found");
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const nextSources: KnowledgeSource[] = [
    ...readKnowledgeSources(config),
    {
      ...input.source,
      status: "processing" as const,
      lastUpdatedAt: new Date().toISOString()
    }
  ];
  const updated = await updateRepo(input.assistantId, input.userId, {
    config: withKnowledgeSources(config, nextSources)
  });
  queueKnowledgeResolution({
    assistantId: input.assistantId,
    userId: input.userId,
    sourceId: input.source.id
  });
  return updated;
}

export async function updateKnowledgeSource(input: {
  assistantId: string;
  userId: string;
  sourceId: string;
  patch: Partial<KnowledgeSource>;
}) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new Error("Assistant not found");
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const current = readKnowledgeSources(config);
  const { status: _ignoredStatus, ...safePatch } = input.patch;
  const shouldReprocess = "content" in safePatch || "type" in safePatch;
  const nextSources = current.map((s) =>
    s.id === input.sourceId
      ? {
          ...s,
          ...safePatch,
          ...(shouldReprocess ? { status: "processing" as const } : {}),
          lastUpdatedAt: new Date().toISOString()
        }
      : s
  );
  const updated = await updateRepo(input.assistantId, input.userId, {
    config: withKnowledgeSources(config, nextSources)
  });
  if (shouldReprocess) {
    queueKnowledgeResolution(input);
  }
  return updated;
}

export async function refreshKnowledgeSource(input: {
  assistantId: string;
  userId: string;
  sourceId: string;
}) {
  const updated = await updateKnowledgeSource({
    ...input,
    patch: { status: "processing" }
  });
  queueKnowledgeResolution(input);
  return updated;
}

export async function removeKnowledgeSource(input: {
  assistantId: string;
  userId: string;
  sourceId: string;
}) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new Error("Assistant not found");
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const nextSources = readKnowledgeSources(config).filter((s) => s.id !== input.sourceId);
  return updateRepo(input.assistantId, input.userId, {
    config: withKnowledgeSources(config, nextSources)
  });
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function deploymentStatusFromConfig(config: Record<string, unknown>): "draft" | "published" {
  const deployment = asRecord(config.deployment);
  return deployment.status === "published" ? "published" : "draft";
}

function buildPublishChecks(config: Record<string, unknown>, assistantName: string): PublishCheck[] {
  const channels = asRecord(config.channels);
  const phone = asRecord(channels.phone);
  const whatsapp = asRecord(channels.whatsapp);
  const model = asRecord(config.model);
  const tools = asRecord(config.tools);
  const customApi = asRecord(tools.custom_api);
  const knowledge = asRecord(config.knowledge);
  const sources = Array.isArray(knowledge.sources) ? knowledge.sources : [];
  const readySources = sources.filter((s) => {
    const r = asRecord(s);
    return r.enabled !== false && r.status === "ready";
  });

  const checks: PublishCheck[] = [
    {
      key: "name",
      label: "Assistant name",
      passed: Boolean(assistantName.trim()),
      message: "Assistant name is required."
    },
    {
      key: "channels",
      label: "At least one channel enabled",
      passed: phone.enabled === true || whatsapp.enabled === true,
      message: "Enable phone or WhatsApp channel."
    },
    {
      key: "phone_details",
      label: "Phone channel details",
      passed:
        phone.enabled !== true ||
        ((typeof phone.number === "string" && phone.number.trim().length > 0) ||
          (() => {
            const twilio = asRecord(phone.twilio);
            return (
              typeof twilio.phoneNumber === "string" && twilio.phoneNumber.trim().length > 0
            );
          })()),
      message: "Phone channel is enabled but Twilio phone number is missing."
    },
    {
      key: "phone_twilio_credentials",
      label: "Twilio credentials",
      passed:
        phone.enabled !== true ||
        (() => {
          const twilio = asRecord(phone.twilio);
          return (
            typeof twilio.accountSid === "string" &&
            twilio.accountSid.trim().length > 0 &&
            typeof twilio.authToken === "string" &&
            twilio.authToken.trim().length > 0
          );
        })(),
      message: "Twilio Account SID and Auth Token are required for Phone channel."
    },
    {
      key: "whatsapp_details",
      label: "WhatsApp channel details",
      passed:
        whatsapp.enabled !== true ||
        (typeof whatsapp.number === "string" && whatsapp.number.trim().length > 0),
      message: "WhatsApp channel is enabled but WhatsApp number is missing."
    },
    {
      key: "model",
      label: "Model configuration",
      passed: typeof model.provider === "string" && typeof model.model === "string",
      message: "Select provider and model in Model tab."
    },
    {
      key: "custom_api",
      label: "Custom API tool setup",
      passed:
        tools.custom_api !== true ||
        (typeof customApi.url === "string" && customApi.url.trim().length > 0),
      message: "Custom API is enabled but webhook URL is missing."
    },
    {
      key: "knowledge",
      label: "Knowledge sources",
      passed: knowledge.enabled !== true || readySources.length > 0,
      message: "Knowledge is enabled but no source is ready."
    }
  ];

  return checks;
}

export async function getPublishReadiness(input: { assistantId: string; userId: string }) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new AppError(404, "Assistant not found", "NOT_FOUND");
  const config = asRecord(assistant.config);
  const checks = buildPublishChecks(config, assistant.name);
  const canPublish = checks.every((c) => c.passed);
  return {
    assistantId: assistant.id,
    status: deploymentStatusFromConfig(config),
    canPublish,
    checks
  };
}

export async function publishAssistant(input: { assistantId: string; userId: string }) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new AppError(404, "Assistant not found", "NOT_FOUND");
  const config = asRecord(assistant.config);
  const checks = buildPublishChecks(config, assistant.name);
  const canPublish = checks.every((c) => c.passed);
  if (!canPublish) {
    throw new AppError(400, "Assistant is not ready to publish.", "PUBLISH_PRECHECK_FAILED");
  }
  const now = new Date().toISOString();
  return updateRepo(input.assistantId, input.userId, {
    active: true,
    config: {
      ...config,
      deployment: {
        ...asRecord(config.deployment),
        status: "published",
        publishedAt: now,
        lastCheckedAt: now
      }
    }
  });
}

export async function unpublishAssistant(input: { assistantId: string; userId: string }) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) throw new AppError(404, "Assistant not found", "NOT_FOUND");
  const config = asRecord(assistant.config);
  const now = new Date().toISOString();
  return updateRepo(input.assistantId, input.userId, {
    config: {
      ...config,
      deployment: {
        ...asRecord(config.deployment),
        status: "draft",
        unpublishedAt: now,
        lastCheckedAt: now
      }
    }
  });
}

function queueKnowledgeResolution(input: { assistantId: string; userId: string; sourceId: string }) {
  setTimeout(() => {
    void resolveKnowledgeStatus(input).catch(() => {});
  }, 500);
}

async function resolveKnowledgeStatus(input: { assistantId: string; userId: string; sourceId: string }) {
  const assistant = await getAssistantByIdForUser(input.assistantId, input.userId);
  if (!assistant) return;
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const current = readKnowledgeSources(config);
  const next = current.map((s) =>
    s.id === input.sourceId
      ? { ...s, status: deriveKnowledgeStatus(s), lastUpdatedAt: new Date().toISOString() }
      : s
  );
  await updateRepo(input.assistantId, input.userId, {
    config: withKnowledgeSources(config, next)
  });
}

function findConflictingNames(input: { assistantName: string; text: string }): string[] {
  const assistantLower = input.assistantName.trim().toLowerCase();
  const out = new Set<string>();
  const re = /\bthis is\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistantLower) continue;
    out.add(name);
  }
  const re2 = /\bI[' ]?m\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re2)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistantLower) continue;
    out.add(name);
  }
  return [...out];
}
