/**
 * Backward-compatible entry for platform tool registration.
 * Prefer importing from `./tooling/platform-tools.registry` in new code.
 */

import type { Tool } from "ai";

import type { PlatformToolId } from "./tooling/platform-tools.registry";
import {
  getPlatformTool,
  getEnabledPlatformTools,
  isPlatformToolId,
  platformToolManifestEntry,
  PLATFORM_TOOL_IDS
} from "./tooling/platform-tools.registry";

export {
  PLATFORM_TOOL_IDS,
  getEnabledPlatformTools as getEnabledTools,
  getPlatformTool,
  isPlatformToolId,
  platformToolManifestEntry
};

export type { PlatformToolId };

/** @deprecated Use PlatformToolId */
export type AvailableTools = PlatformToolId;

export const predefinedTools: Record<PlatformToolId, Tool> = {
  getWeather: getPlatformTool("getWeather"),
  getCurrentTime: getPlatformTool("getCurrentTime")
};
