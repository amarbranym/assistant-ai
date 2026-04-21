"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ToolCard } from "../components/tool-card";
import { ToolEditorSheet } from "../components/tool-editor-sheet";
import { DEFAULT_TOOLS, loadToolsFromStorage, saveToolsToStorage } from "../lib/tools-storage";
import type { ManagedTool } from "../types";

export function ToolsBuilderView() {
  const [tools, setTools] = useState<ManagedTool[]>(DEFAULT_TOOLS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "connected" | "needs_setup" | "draft" | "inactive">("all");
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  useEffect(() => {
    setTools(loadToolsFromStorage());
  }, []);

  useEffect(() => {
    saveToolsToStorage(tools);
  }, [tools]);

  const editableTools = tools.filter((t) => !t.isInternal);
  const internalCount = tools.filter((t) => t.isInternal).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return editableTools.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.provider.toLowerCase().includes(q)
      );
    });
  }, [editableTools, filter, query]);

  const selected = tools.find((t) => t.id === selectedToolId) ?? null;

  function upsertTool(next: ManagedTool) {
    setTools((prev) => prev.map((t) => (t.id === next.id ? next : t)));
  }

  function addCustomTool() {
    const t: ManagedTool = {
      id: crypto.randomUUID(),
      slug: "custom",
      name: "Custom Tool",
      description: "User-defined integration action",
      provider: "custom",
      status: "draft",
      active: false,
      endpointUrl: "",
      authType: "none",
      authValue: "",
      baseHeaders: [],
      params: [],
      isInternal: false
    };
    setTools((prev) => [t, ...prev]);
    setSelectedToolId(t.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <DashboardPageHeader
        title="Tools"
        description="Connect, configure, and manage user-controlled automation tools."
        actions={
          <Button size="sm" className="gap-1.5" onClick={addCustomTool}>
            <Plus className="size-4" />
            New custom tool
          </Button>
        }
      />

      <div className="w-full flex-1 px-5 py-6 sm:px-6">
        <Card className="border-border/80 mb-4">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
              <Input
                className="pl-8"
                placeholder="Search tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "connected", "needs_setup", "draft", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={cn(
                    buttonVariants({ variant: filter === f ? "default" : "outline", size: "sm" }),
                    "h-7 px-2.5 text-xs capitalize"
                  )}
                  onClick={() => setFilter(f)}
                >
                  {f === "needs_setup" ? "Needs setup" : f}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mb-3 text-xs text-muted-foreground">
          {internalCount} internal tools are managed by system and hidden from user control.
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No tools match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onEdit={setSelectedToolId} />
            ))}
          </div>
        )}
      </div>

      <ToolEditorSheet
        open={selectedToolId !== null}
        tool={selected}
        onOpenChange={(next) => {
          if (!next) setSelectedToolId(null);
        }}
        onSave={upsertTool}
      />
    </div>
  );
}

