export type ToolStatus = "connected" | "needs_setup" | "draft" | "inactive";

export type ToolParameter = {
  id: string;
  key: string;
  value: string;
  required: boolean;
};

export type ManagedTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  provider: "hubspot" | "telecrm" | "custom";
  status: ToolStatus;
  active: boolean;
  endpointUrl: string;
  authType: "none" | "api_key" | "bearer";
  authValue: string;
  baseHeaders: ToolParameter[];
  params: ToolParameter[];
  isInternal: boolean;
};

