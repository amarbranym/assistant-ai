import type { PlatformToolId } from "./platform-tools.registry";
import { isPlatformToolId } from "./platform-tools.registry";

/**
 * Reads assistant `config.tools` and returns which platform tools are selected.
 * Supports:
 * - Array of tool ids: `["getWeather"]`
 * - Flat flags: `{ getWeather: true, web_search: false }`
 * - Optional nested `tools.platform`: `{ platform: { getWeather: true } }` (Vapi-style attachment map)
 *
 * Unknown ids (e.g. future `web_search`) are ignored until implemented in the platform registry.
 */
export function parseEnabledPlatformToolIds(config: Record<string, unknown>): Set<PlatformToolId> {
  const enabled = new Set<PlatformToolId>();
  const root = config.tools;
  if (!root || typeof root !== "object") return enabled;

  const addId = (raw: string) => {
    if (isPlatformToolId(raw)) enabled.add(raw);
  };

  if (Array.isArray(root)) {
    for (const x of root) {
      if (typeof x === "string" && x.trim()) addId(x.trim());
    }
    return enabled;
  }

  const tools = root as Record<string, unknown>;

  const platform = tools.platform;
  if (platform && typeof platform === "object") {
    for (const [k, v] of Object.entries(platform as Record<string, unknown>)) {
      if (v === true) addId(k);
    }
  }

  for (const [k, v] of Object.entries(tools)) {
    if (k === "platform" || k === "custom_api") continue;
    if (v === true) addId(k);
  }

  return enabled;
}
