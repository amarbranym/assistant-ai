"use client";

import { PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManagedTool } from "../types";
import { ToolStatusBadge } from "./tool-status-badge";

export function ToolCard({
  tool,
  onEdit
}: {
  tool: ManagedTool;
  onEdit: (toolId: string) => void;
}) {
  return (
    <Card className="border-border/80 shadow-theme">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold">{tool.name}</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">{tool.description}</p>
          </div>
          <ToolStatusBadge status={tool.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          <span>Provider: {tool.provider}</span>
          <span>Params: {tool.params.length}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(tool.id)}>
          <PencilLine className="size-3.5" />
          Edit tool
        </Button>
      </CardContent>
    </Card>
  );
}

