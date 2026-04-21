"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addKnowledgeSource,
  fetchKnowledgeSources,
  refreshKnowledgeSource,
  removeKnowledgeSource,
  updateKnowledgeSource,
  type CreateKnowledgeSourceInput,
  type UpdateKnowledgeSourceInput
} from "../api/knowledge.api";
import { assistantsQueryKeys } from "../api/assistants-query-keys";

const knowledgeKey = (assistantId: string) =>
  [...assistantsQueryKeys.detail(assistantId), "knowledge"] as const;

export function useKnowledgeSourcesQuery(assistantId?: string) {
  return useQuery({
    queryKey: assistantId ? knowledgeKey(assistantId) : ["assistants", "knowledge", "disabled"],
    queryFn: () => fetchKnowledgeSources(assistantId as string),
    enabled: Boolean(assistantId)
  });
}

export function useAddKnowledgeSourceMutation(assistantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (source: CreateKnowledgeSourceInput) => addKnowledgeSource(assistantId, source),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: knowledgeKey(assistantId) });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(assistantId) });
    }
  });
}

export function useUpdateKnowledgeSourceMutation(assistantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, patch }: { sourceId: string; patch: UpdateKnowledgeSourceInput }) =>
      updateKnowledgeSource(assistantId, sourceId, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: knowledgeKey(assistantId) });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(assistantId) });
    }
  });
}

export function useRefreshKnowledgeSourceMutation(assistantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => refreshKnowledgeSource(assistantId, sourceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: knowledgeKey(assistantId) });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(assistantId) });
    }
  });
}

export function useRemoveKnowledgeSourceMutation(assistantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => removeKnowledgeSource(assistantId, sourceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: knowledgeKey(assistantId) });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(assistantId) });
    }
  });
}
