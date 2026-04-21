import { lookup } from "dns/promises";
import { isIP } from "net";

import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

/**
 * SSRF-hardened `fetch` wrapper for user-configurable URLs (custom-api tool,
 * managed integrations). Enforces:
 * - https/http scheme only (no file://, no javascript:)
 * - block private/loopback/link-local IPs in production
 * - bounded total timeout via AbortController
 * - optional max-response-bytes read cap
 */
export type SafeFetchOptions = RequestInit & {
  /** Timeout for the entire request in ms. Defaults to `env.toolFetchTimeoutMs`. */
  timeoutMs?: number;
  /** Cap for `response.text()` body size. Defaults to 1 MiB. */
  maxResponseBytes?: number;
};

const DEFAULT_MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB

function isPrivateIpv4(ip: string): boolean {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false;
  const parts = ip.split(".").map((x) => Number.parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  // IPv4-mapped ::ffff:a.b.c.d
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice(7);
    return isPrivateIpv4(v4);
  }
  return false;
}

async function assertPublicHostname(hostname: string): Promise<void> {
  if (env.allowPrivateToolTargets) return;

  const raw = hostname.replace(/^\[|\]$/g, "");
  const ipVersion = isIP(raw);
  if (ipVersion === 4 && isPrivateIpv4(raw)) {
    throw new AppError(400, "Target IP is not allowed (private/loopback)", "SSRF_BLOCKED");
  }
  if (ipVersion === 6 && isPrivateIpv6(raw)) {
    throw new AppError(400, "Target IP is not allowed (private/loopback)", "SSRF_BLOCKED");
  }
  if (ipVersion !== 0) return; // public IP literal

  const lc = raw.toLowerCase();
  if (lc === "localhost" || lc.endsWith(".localhost")) {
    throw new AppError(400, "Target host is not allowed (localhost)", "SSRF_BLOCKED");
  }
  let addrs: Array<{ address: string; family: number }> = [];
  try {
    addrs = await lookup(raw, { all: true });
  } catch {
    throw new AppError(502, `DNS lookup failed for ${raw}`, "TOOL_DNS_FAILED");
  }
  for (const a of addrs) {
    if (a.family === 4 && isPrivateIpv4(a.address)) {
      throw new AppError(400, `Target host ${raw} resolves to a private IP`, "SSRF_BLOCKED");
    }
    if (a.family === 6 && isPrivateIpv6(a.address)) {
      throw new AppError(400, `Target host ${raw} resolves to a private IP`, "SSRF_BLOCKED");
    }
  }
}

/**
 * Validate the URL is safe to fetch on behalf of user-supplied tool config.
 * Throws `AppError` with a clear `code` so the caller can surface a friendly message.
 */
export async function assertSafeTargetUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError(400, "Invalid URL", "INVALID_URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError(
      400,
      `Unsupported URL scheme: ${parsed.protocol}`,
      "INVALID_URL_SCHEME"
    );
  }
  await assertPublicHostname(parsed.hostname);
  return parsed;
}

/**
 * Perform a fetch with timeout + SSRF guard + response-size cap.
 * Returns a tuple of (status, ok, text).
 */
export async function safeFetch(
  rawUrl: string,
  init: SafeFetchOptions = {}
): Promise<{ ok: boolean; status: number; text: string; headers: Headers }> {
  const parsed = await assertSafeTargetUrl(rawUrl);
  const { timeoutMs = env.toolFetchTimeoutMs, maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES, signal: externalSignal, ...rest } =
    init;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Tool fetch timeout")), timeoutMs);
  const abortListener = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abortListener, { once: true });
  }

  try {
    const response = await fetch(parsed.toString(), {
      ...rest,
      signal: controller.signal
    });

    // Enforce body size cap.
    const reader = response.body?.getReader();
    let text = "";
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxResponseBytes) {
          reader.cancel().catch(() => {});
          text += decoder.decode();
          text += "\n[truncated: response exceeded max size]";
          break;
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } else {
      text = await response.text().catch(() => "");
    }

    return {
      ok: response.ok,
      status: response.status,
      text,
      headers: response.headers
    };
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new AppError(
        504,
        `Tool fetch timed out after ${timeoutMs}ms`,
        "TOOL_TIMEOUT"
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener("abort", abortListener);
  }
}
