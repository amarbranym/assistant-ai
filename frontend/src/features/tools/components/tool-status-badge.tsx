"use client";

import { Badge } from "@/components/ui/badge";
import type { ToolStatus } from "../types";

export function ToolStatusBadge({ status }: { status: ToolStatus }) {
  if (status === "connected") {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Connected</Badge>;
  }
  if (status === "needs_setup") {
    return <Badge variant="secondary">Needs setup</Badge>;
  }
  if (status === "inactive") {
    return <Badge variant="outline">Inactive</Badge>;
  }
  return <Badge variant="outline">Draft</Badge>;
}

