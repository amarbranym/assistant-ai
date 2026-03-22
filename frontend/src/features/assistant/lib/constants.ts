export const ASSISTANTS_ROUTE = "/assistants" as const;

/** Create flow — full page at this path (not a modal). */
export const ASSISTANT_NEW_ROUTE = `${ASSISTANTS_ROUTE}/new` as const;

export function assistantEditRoute(id: string) {
  return `${ASSISTANTS_ROUTE}/${id}/edit` as const;
}
