"use client";

import { useEffect, useMemo, useState } from "react";

export type AssistantRuntimeMode = "test" | "live";

export function useAssistantRuntimeMode(assistantId: string) {
  const storageKey = useMemo(
    () => `assistant-runtime-mode:${assistantId}`,
    [assistantId]
  );
  const [mode, setMode] = useState<AssistantRuntimeMode>("test");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === "live" || raw === "test") {
        setMode(raw);
      }
    } catch {
      // no-op
    }
  }, [storageKey]);

  function updateMode(next: AssistantRuntimeMode) {
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // no-op
    }
  }

  return { mode, setMode: updateMode };
}
