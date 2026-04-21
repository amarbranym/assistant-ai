import type { Tool } from "ai";
import type { Assistant } from "@prisma/client";

import { buildCustomApiTool } from "../custom-api.tool";
import { buildManagedIntegrationToolsWithManifest } from "../managed-tools.tool";
import type {
  ResolvedAssistantRuntimeTools,
  ResolveAssistantRuntimeToolsInput,
  RuntimeToolManifestEntry
} from "./assistant-tools.types";
import {
  getPlatformTool,
  platformToolManifestEntry,
  type PlatformToolId
} from "./platform-tools.registry";
import { parseEnabledPlatformToolIds } from "./parse-assistant-tools";

function readCustomApiManifest(): RuntimeToolManifestEntry {
  return {
    kind: "custom_api",
    id: "custom_api",
    label: "Custom API",
    usageSummary:
      "Use when the user’s request should trigger the assistant’s configured HTTP webhook. " +
      "Collect all required fields from the user before calling; never guess missing values."
  };
}

/**
 * Builds the tool record and manifest for one assistant turn.
 * - Platform tools: only those explicitly enabled in config.
 * - Custom API: attached only when webhook config is valid (`buildCustomApiTool` non-null).
 * - Managed integrations: rows with `enabled` + endpoint (existing managed-tools behavior).
 * - `extraTools` merged last (call-site overrides).
 */
export function resolveAssistantRuntimeTools(
  assistant: Assistant,
  input: ResolveAssistantRuntimeToolsInput
): ResolvedAssistantRuntimeTools {
  const manifest: RuntimeToolManifestEntry[] = [];
  const tools: Record<string, Tool> = {};

  const enabledPlatform = parseEnabledPlatformToolIds(input.assistantConfig);
  for (const id of enabledPlatform) {
    const pid = id as PlatformToolId;
    tools[pid] = getPlatformTool(pid);
    manifest.push(platformToolManifestEntry(pid));
  }

  const customApi = buildCustomApiTool({
    assistant,
    conversationId: input.conversationId,
    mode: input.mode
  });
  if (customApi) {
    tools.custom_api = customApi;
    manifest.push(readCustomApiManifest());
  }

  const managed = buildManagedIntegrationToolsWithManifest({
    assistant,
    conversationId: input.conversationId,
    mode: input.mode
  });
  Object.assign(tools, managed.tools);
  manifest.push(...managed.manifest);

  if (input.extraTools) {
    for (const [k, t] of Object.entries(input.extraTools)) {
      tools[k] = t;
      if (!manifest.some((m) => m.id === k)) {
        manifest.push({
          kind: "platform",
          id: k,
          label: k,
          usageSummary: "Additional tool supplied by the runtime."
        });
      }
    }
  }

  const keys = Object.keys(tools);
  return {
    tools: keys.length > 0 ? tools : undefined,
    manifest
  };
}
