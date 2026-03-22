export const assistantsQueryKeys = {
  all: ["assistants"] as const,
  list: () => [...assistantsQueryKeys.all, "list"] as const,
  detail: (id: string) => [...assistantsQueryKeys.all, "detail", id] as const,
} as const;
