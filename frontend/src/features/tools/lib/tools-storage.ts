"use client";

import type { ManagedTool } from "../types";

const STORAGE_KEY = "assistant-tools-builder:v1";

export const DEFAULT_TOOLS: ManagedTool[] = [
  {
    id: "tool-hubspot",
    slug: "hubspot",
    name: "HubSpot",
    description: "Sync contacts, deals, and lead updates to HubSpot CRM.",
    provider: "hubspot",
    status: "needs_setup",
    active: false,
    endpointUrl: "https://api.hubapi.com/crm/v3/objects/contacts",
    authType: "api_key",
    authValue: "",
    baseHeaders: [],
    params: [
      { id: "hs-1", key: "firstname", value: "", required: true },
      { id: "hs-2", key: "email", value: "", required: true }
    ],
    isInternal: false
  },
  {
    id: "tool-telecrm",
    slug: "telecrm",
    name: "TeleCRM",
    description: "Push captured leads and call outcomes to TeleCRM.",
    provider: "telecrm",
    status: "needs_setup",
    active: false,
    endpointUrl: "",
    authType: "bearer",
    authValue: "",
    baseHeaders: [],
    params: [
      { id: "tc-1", key: "name", value: "", required: true },
      { id: "tc-2", key: "phone", value: "", required: true }
    ],
    isInternal: false
  },
  {
    id: "tool-internal-safety",
    slug: "internal_safety_guard",
    name: "Internal Safety Guard",
    description: "Managed by system.",
    provider: "custom",
    status: "connected",
    active: true,
    endpointUrl: "",
    authType: "none",
    authValue: "",
    baseHeaders: [],
    params: [],
    isInternal: true
  }
];

export function loadToolsFromStorage(): ManagedTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOOLS;
    const parsed = JSON.parse(raw) as ManagedTool[];
    if (!Array.isArray(parsed)) return DEFAULT_TOOLS;
    return parsed;
  } catch {
    return DEFAULT_TOOLS;
  }
}

export function saveToolsToStorage(tools: ManagedTool[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  } catch {
    // no-op
  }
}

