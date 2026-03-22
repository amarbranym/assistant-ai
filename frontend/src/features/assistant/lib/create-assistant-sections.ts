export const CREATE_ASSISTANT_TABS = [
  { value: "model", label: "Model" },
  { value: "voice", label: "Voice" },
  { value: "tools", label: "Tools" },
  { value: "advanced", label: "Advanced" },
] as const;

export type CreateAssistantTabValue =
  (typeof CREATE_ASSISTANT_TABS)[number]["value"];
