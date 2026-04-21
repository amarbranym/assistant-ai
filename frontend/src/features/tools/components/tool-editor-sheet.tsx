"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ManagedTool } from "../types";
import { ToolStatusBadge } from "./tool-status-badge";
import { ToolParamsEditor } from "./tool-params-editor";

export function ToolEditorSheet({
  open,
  tool,
  onOpenChange,
  onSave
}: {
  open: boolean;
  tool: ManagedTool | null;
  onOpenChange: (next: boolean) => void;
  onSave: (tool: ManagedTool) => void;
}) {
  const [draft, setDraft] = useState<ManagedTool | null>(tool);

  useEffect(() => {
    setDraft(tool);
  }, [tool]);

  if (!draft) {
    return <Sheet open={open} onOpenChange={onOpenChange} />;
  }

  const hasEndpoint = Boolean(draft.endpointUrl.trim());
  const hasAuth = draft.authType === "none" || Boolean(draft.authValue.trim());
  const setupCompleted = Number(hasEndpoint) + Number(hasAuth);
  const setupTotal = 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle>{draft.name}</SheetTitle>
              <SheetDescription>Configure this tool in a few simple steps.</SheetDescription>
            </div>
            <ToolStatusBadge status={draft.status} />
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Provider</span>
              <p className="text-sm font-semibold capitalize">{draft.provider}</p>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Setup progress</span>
              <p className="text-sm font-semibold">
                {setupCompleted}/{setupTotal}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Runtime</span>
              <p className="text-sm font-semibold">{draft.active ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">1) Basic details</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Give this tool a clear name and short purpose so users can understand it quickly.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Tool name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) =>
                    setDraft({
                      ...draft,
                      status: v as ManagedTool["status"]
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="needs_setup">Needs setup</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">2) Connection setup</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Set endpoint and authentication used when this tool is called.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs">Endpoint / Base URL</Label>
                <Input
                  value={draft.endpointUrl}
                  onChange={(e) => setDraft({ ...draft, endpointUrl: e.target.value })}
                  placeholder="https://api.example.com/v1/..."
                />
              </div>
              <div>
                <Label className="text-xs">Auth type</Label>
                <Select
                  value={draft.authType}
                  onValueChange={(v) =>
                    setDraft({
                      ...draft,
                      authType: v as ManagedTool["authType"]
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No auth</SelectItem>
                    <SelectItem value="api_key">API key</SelectItem>
                    <SelectItem value="bearer">Bearer token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.authType !== "none" ? (
                <div>
                  <Label className="text-xs">Auth value</Label>
                  <Input
                    value={draft.authValue}
                    onChange={(e) => setDraft({ ...draft, authValue: e.target.value })}
                    placeholder={draft.authType === "bearer" ? "token..." : "key..."}
                  />
                </div>
              ) : (
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  No credential required for this auth mode.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">3) Runtime control</p>
            <div className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium">Enable this tool for runtime</span>
              <Switch
                checked={draft.active}
                onCheckedChange={(active) => setDraft({ ...draft, active })}
              />
            </div>
          </div>

          <details className="rounded-lg border px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">Advanced configuration</summary>
            <p className="text-muted-foreground mt-1 text-xs">
              Optional parameters and headers for specific integration requirements.
            </p>
            <div className="mt-3 space-y-4">
              <ToolParamsEditor
                title="Custom parameters"
                params={draft.params}
                onChange={(params) => setDraft({ ...draft, params })}
              />

              <ToolParamsEditor
                title="Headers"
                params={draft.baseHeaders}
                onChange={(baseHeaders) => setDraft({ ...draft, baseHeaders })}
              />
            </div>
          </details>
        </div>

        <div className="border-t px-5 py-3">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(draft);
                onOpenChange(false);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

