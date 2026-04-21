export const CREATE_ASSISTANT_TABS = [
  { value: "channels", label: "Channels" },
  { value: "model", label: "Model" },
  { value: "voice", label: "Voice" },
  { value: "knowledge", label: "Knowledge" },
  { value: "tools", label: "Tools" },
  { value: "advanced", label: "Advanced" },
] as const;

export type CreateAssistantTabValue =
  (typeof CREATE_ASSISTANT_TABS)[number]["value"];
