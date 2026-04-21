"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAssistant,
  deleteAssistant,
  fetchAssistant,
  fetchAssistantPublishReadiness,
  fetchAssistants,
  publishAssistant,
  unpublishAssistant,
  updateAssistant,
} from "../api/assistants.api";
import { assistantsQueryKeys } from "../api/assistants-query-keys";
import type {
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "../types/api-assistant";

export function useAssistantsQuery() {
  return useQuery({
    queryKey: assistantsQueryKeys.list(),
    queryFn: fetchAssistants,
  });
}

export function useAssistantQuery(id: string) {
  return useQuery({
    queryKey: assistantsQueryKeys.detail(id),
    queryFn: () => fetchAssistant(id),
    enabled: Boolean(id),
  });
}

export function useAssistantPublishReadinessQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: [...assistantsQueryKeys.detail(id), "publish-readiness"],
    queryFn: () => fetchAssistantPublishReadiness(id),
    enabled: Boolean(id) && enabled
  });
}

export function useCreateAssistantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssistantPayload) => createAssistant(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.all });
    },
  });
}

export function useUpdateAssistantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAssistantPayload;
    }) => updateAssistant(id, input),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.all });
      void qc.invalidateQueries({
        queryKey: assistantsQueryKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteAssistantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssistant(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.all });
    },
  });
}

export function usePublishAssistantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishAssistant(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.all });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(id) });
    }
  });
}

export function useUnpublishAssistantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishAssistant(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.all });
      void qc.invalidateQueries({ queryKey: assistantsQueryKeys.detail(id) });
    }
  });
}
