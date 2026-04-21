"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ToolParameter } from "../types";

export function ToolParamsEditor({
  title,
  params,
  onChange
}: {
  title: string;
  params: ToolParameter[];
  onChange: (next: ToolParameter[]) => void;
}) {
  const add = () =>
    onChange([
      ...params,
      { id: crypto.randomUUID(), key: "", value: "", required: false }
    ]);

  const update = (id: string, patch: Partial<ToolParameter>) =>
    onChange(params.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => onChange(params.filter((p) => p.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
      {params.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
          No entries added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {params.map((p) => (
            <div key={p.id} className="grid gap-2 rounded-lg border bg-muted/10 p-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                placeholder="Key"
                value={p.key}
                onChange={(e) => update(p.id, { key: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={p.value}
                onChange={(e) => update(p.id, { value: e.target.value })}
              />
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <Switch
                  checked={p.required}
                  onCheckedChange={(v) => update(p.id, { required: v })}
                />
                Required
              </label>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

