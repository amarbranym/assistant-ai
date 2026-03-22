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
  fetchAssistants,
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
