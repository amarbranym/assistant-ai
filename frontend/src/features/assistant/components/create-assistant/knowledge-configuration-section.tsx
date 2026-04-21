"use client";

import { CheckCircle2, Clock3, Plus, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddKnowledgeSourceMutation,
  useKnowledgeSourcesQuery,
  useRefreshKnowledgeSourceMutation,
  useRemoveKnowledgeSourceMutation,
  useUpdateKnowledgeSourceMutation
} from "@/features/assistant/hooks/use-assistant-knowledge";
import type { CreateAssistantFormValues } from "@/features/assistant/schemas/create-assistant-form.schema";

export function KnowledgeConfigurationSection({
  assistantId
}: {
  assistantId?: string;
}) {
  const { control, register, setValue, watch } = useFormContext<CreateAssistantFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "knowledgeSources"
  });
  const isLive = Boolean(assistantId);
  const knowledgeQuery = useKnowledgeSourcesQuery(assistantId);
  const addMutation = useAddKnowledgeSourceMutation(assistantId ?? "");
  const updateMutation = useUpdateKnowledgeSourceMutation(assistantId ?? "");
  const refreshMutation = useRefreshKnowledgeSourceMutation(assistantId ?? "");
  const removeMutation = useRemoveKnowledgeSourceMutation(assistantId ?? "");

  const [newType, setNewType] = useState<"url" | "text" | "file">("url");
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const counts = useMemo(() => {
    const list = watch("knowledgeSources") ?? [];
    return {
      total: list.length,
      ready: list.filter((x) => x.status === "ready").length,
      processing: list.filter((x) => x.status === "processing").length,
      failed: list.filter((x) => x.status === "failed").length
    };
  }, [watch]);

  useEffect(() => {
    if (!isLive || !knowledgeQuery.data) return;
    setValue("knowledgeSources", knowledgeQuery.data, { shouldDirty: false });
  }, [isLive, knowledgeQuery.data, setValue]);

  async function addSource() {
    if (!newName.trim()) return;
    let contentValue = newContent.trim();
    if (newType === "file") {
      if (!newFile) return;
      contentValue = await fileToKnowledgeContent(newFile);
    }
    const source = {
      id: crypto.randomUUID(),
      type: newType,
      name: newName.trim(),
      content: contentValue,
      enabled: true,
      status: "processing",
      lastUpdatedAt: new Date().toISOString()
    } as const;
    if (isLive && assistantId) {
      void addMutation.mutateAsync({
        id: source.id,
        type: source.type,
        name: source.name,
        content: source.content,
        enabled: source.enabled
      });
    } else {
      append(source);
    }
    setNewName("");
    setNewContent("");
    setNewFile(null);
  }

  return (
    <Card className="border-border/80 py-5 shadow-theme">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className="text-lg font-semibold tracking-tight">Knowledge & Training</CardTitle>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Teach your assistant using websites, text notes, and documents.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total" value={counts.total} />
          <Stat label="Ready" value={counts.ready} tone="ready" />
          <Stat label="Processing" value={counts.processing} tone="processing" />
          <Stat label="Failed" value={counts.failed} tone="failed" />
        </div>

        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-semibold">Add source</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as "url" | "text" | "file")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Website URL</SelectItem>
                  <SelectItem value="text">Text / Notes</SelectItem>
                  <SelectItem value="file">File (metadata)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Pricing page, FAQ doc, company policy..." />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs">
                {newType === "url" ? "URL" : newType === "file" ? "Upload file" : "Content"}
              </Label>
              {newType === "file" ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setNewFile(file);
                      if (file && !newName.trim()) {
                        const withoutExt = file.name.replace(/\.[^/.]+$/, "");
                        setNewName(withoutExt);
                      }
                    }}
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Supported best: txt, md, json, csv, html. Other files are stored as metadata.
                  </p>
                  {newFile ? (
                    <p className="text-muted-foreground text-xs">
                      Selected: {newFile.name} ({Math.ceil(newFile.size / 1024)} KB)
                    </p>
                  ) : null}
                </div>
              ) : (
                <Textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={newType === "url" ? "https://example.com" : "Paste important business information here..."}
                />
              )}
            </div>
          </div>
          <Button
            type="button"
            className="mt-3"
            onClick={() => void addSource()}
            disabled={newType === "file" && !newFile}
          >
            <Plus className="size-4" />
            Add source
          </Button>
        </div>

        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              No knowledge sources yet. Add your first source above.
            </p>
          ) : (
            fields.map((field, index) => {
              const sourceId = watch(`knowledgeSources.${index}.id`);
              const status = watch(`knowledgeSources.${index}.status`);
              return (
                <div key={field.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{watch(`knowledgeSources.${index}.name`)}</p>
                      <p className="text-muted-foreground text-xs">{watch(`knowledgeSources.${index}.type`).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(watch(`knowledgeSources.${index}.enabled`))}
                        onCheckedChange={(next) => {
                          if (isLive && assistantId) {
                            void updateMutation.mutateAsync({
                              sourceId: sourceId || field.id,
                              patch: { enabled: next }
                            });
                          }
                          
                          setValue(`knowledgeSources.${index}.enabled`, next, {
                            shouldDirty: true
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isLive && assistantId) {
                            void removeMutation.mutateAsync(sourceId || field.id);
                          }
                          remove(index);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {status === "ready" ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : null}
                    {status === "processing" ? <Clock3 className="size-3.5 text-amber-500" /> : null}
                    {status === "failed" ? <XCircle className="size-3.5 text-red-500" /> : null}
                    <span className="text-muted-foreground capitalize">{status}</span>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <FormField label="Name" id={`knowledge-name-${index}`}>
                      <Input
                        {...register(`knowledgeSources.${index}.name`, {
                          onBlur: (e) => {
                            if (isLive && assistantId) {
                              void updateMutation.mutateAsync({
                                sourceId: sourceId || field.id,
                                patch: { name: e.target.value }
                              });
                            }
                          }
                        })}
                      />
                    </FormField>
                    <div className="flex items-end">
                      <p className="text-muted-foreground text-xs">
                        Status is set automatically by server processing.
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <FormField label="Content / URL" id={`knowledge-content-${index}`}>
                        <Textarea
                          rows={2}
                          {...register(`knowledgeSources.${index}.content`, {
                            onBlur: (e) => {
                              if (isLive && assistantId) {
                                void updateMutation.mutateAsync({
                                  sourceId: sourceId || field.id,
                                  patch: { content: e.target.value }
                                });
                              }
                            }
                          })}
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isLive && assistantId) {
                            void refreshMutation.mutateAsync(sourceId || field.id);
                          }
                          setValue(`knowledgeSources.${index}.status`, "processing", { shouldDirty: true });
                        }}
                      >
                        Refresh source
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {isLive && knowledgeQuery.isFetching ? (
          <p className="text-muted-foreground text-xs">Syncing knowledge sources…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

async function fileToKnowledgeContent(file: File): Promise<string> {
  const textFriendly =
    file.type.startsWith("text/") ||
    /\.(txt|md|json|csv|html|xml|ts|tsx|js|jsx|py|java|go|rs|sql)$/i.test(file.name);
  if (textFriendly) {
    const text = await file.text();
    return text.slice(0, 20000);
  }
  return `Uploaded file metadata:\nname=${file.name}\ntype=${file.type || "unknown"}\nsize=${file.size} bytes`;
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "ready" | "processing" | "failed" }) {
  const toneClass =
    tone === "ready"
      ? "text-emerald-600"
      : tone === "processing"
        ? "text-amber-600"
        : tone === "failed"
          ? "text-red-600"
          : "text-foreground";
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
