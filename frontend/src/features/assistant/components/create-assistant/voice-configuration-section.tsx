"use client";

import { Loader2, Play, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { FormField } from "@/components/form/form-field";
import { SliderField } from "@/components/form/slider-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateVoicePreview, fetchVoiceCatalog, uploadCustomVoice, type VoiceCatalogItem } from "@/features/assistant/api/voice.api";
import {
  STREAMING_LATENCY_OPTIONS,
} from "@/features/assistant/lib/wizard-model-options";
import type {
  CreateAssistantFormValues,
  StreamingLatencyMode,
} from "@/features/assistant/schemas/create-assistant-form.schema";

export function VoiceConfigurationSection() {
  const {
    control,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<CreateAssistantFormValues>();
  const pending = isSubmitting;
  const [voices, setVoices] = useState<VoiceCatalogItem[]>([]);
  const [voiceLoadError, setVoiceLoadError] = useState<string | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [customVoiceName, setCustomVoiceName] = useState("");
  const [customVoiceDescription, setCustomVoiceDescription] = useState("");
  const [customVoiceFile, setCustomVoiceFile] = useState<File | null>(null);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [voiceLibraryOpen, setVoiceLibraryOpen] = useState(false);

  const useVoiceIdManually = useWatch({
    control,
    name: "useVoiceIdManually",
  });
  const selectedVoiceId = useWatch({ control, name: "voiceCatalogId" });

  const streamingMode = useWatch({
    control,
    name: "optimizeStreamingLatency",
  });

  const streamingHint =
    STREAMING_LATENCY_OPTIONS.find((o) => o.value === streamingMode)?.hint ??
    "";

  const selectedVoiceMeta = useMemo(
    () => voices.find((voice) => voice.id === selectedVoiceId) ?? null,
    [voices, selectedVoiceId]
  );
  const filteredVoices = useMemo(() => {
    const q = voiceSearch.trim().toLowerCase();
    if (!q) return voices;
    return voices.filter((v) => {
      const labelText = Object.values(v.labels ?? {}).join(" ").toLowerCase();
      return v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || labelText.includes(q);
    });
  }, [voiceSearch, voices]);

  async function loadVoices() {
    setVoicesLoading(true);
    setVoiceLoadError(null);
    const data = await fetchVoiceCatalog();
    setVoices(data);
  }

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        await loadVoices();
        if (!active) return;
      } catch (e) {
        if (!active) return;
        setVoiceLoadError(e instanceof Error ? e.message : "Failed to load voices");
      } finally {
        if (active) setVoicesLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  async function playPreview(voiceId: string, fallbackText?: string) {
    try {
      setPreviewError(null);
      setPreviewLoadingId(voiceId);
      const preview = await generateVoicePreview({
        voiceId,
        text: fallbackText
      });
      const src = `data:${preview.mimeType};base64,${preview.audio}`;
      const audio = new Audio(src);
      void audio.play();
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Could not preview voice.");
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleCustomVoiceUpload() {
    if (!customVoiceFile) return;
    if (!customVoiceName.trim()) return;
    const base64 = await fileToBase64(customVoiceFile);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadingVoice(true);
    try {
      const created = await uploadCustomVoice({
        name: customVoiceName.trim(),
        description: customVoiceDescription.trim() || undefined,
        fileName: customVoiceFile.name,
        mimeType: customVoiceFile.type || "audio/mpeg",
        audioBase64: base64
      });
      setValue("useVoiceIdManually", true, { shouldDirty: true });
      setValue("voiceManualId", created.id, { shouldDirty: true, shouldValidate: true });
      setCustomVoiceFile(null);
      setUploadSuccess(`Uploaded "${created.name}" successfully.`);
      await loadVoices();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Voice upload failed.");
    } finally {
      setUploadingVoice(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80 py-5 shadow-theme">
        <CardHeader className="pb-4 pt-0">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Voice
          </CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            ElevenLabs is used for voice synthesis. Pick a voice and preview it instantly.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Voice type
            </p>
            <p className="mt-1 text-sm font-semibold">Choose voice source first</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Select predefined voice from the library, or add your custom voice.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={useVoiceIdManually ? "outline" : "default"}
                className={
                  !useVoiceIdManually
                    ? "bg-slate-700 text-slate-50 hover:bg-slate-800 dark:bg-slate-300 dark:text-slate-900 dark:hover:bg-slate-200"
                    : ""
                }
                onClick={() =>
                  setValue("useVoiceIdManually", false, { shouldDirty: true, shouldValidate: true })
                }
              >
                Use predefined voice
              </Button>
              <Button
                type="button"
                variant={useVoiceIdManually ? "default" : "outline"}
                className={
                  useVoiceIdManually
                    ? "bg-slate-700 text-slate-50 hover:bg-slate-800 dark:bg-slate-300 dark:text-slate-900 dark:hover:bg-slate-200"
                    : ""
                }
                onClick={() =>
                  setValue("useVoiceIdManually", true, { shouldDirty: true, shouldValidate: true })
                }
              >
                Add custom voice
              </Button>
            </div>
          </div>

          {!useVoiceIdManually ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Selected voice
                    </p>
                    <p className="mt-1 truncate text-base font-semibold">
                      {selectedVoiceMeta ? selectedVoiceMeta.name : "No voice selected"}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {selectedVoiceMeta ? selectedVoiceMeta.id : "Choose a voice from the library."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 bg-indigo-600 text-indigo-50 hover:bg-indigo-700 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300"
                    onClick={() => setVoiceLibraryOpen(true)}
                  >
                    Open library
                  </Button>
                </div>

                {selectedVoiceMeta?.labels && Object.keys(selectedVoiceMeta.labels).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(selectedVoiceMeta.labels)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <Badge
                          key={`${selectedVoiceMeta.id}-${k}`}
                          variant="secondary"
                          className="bg-slate-100 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {k}: {v}
                        </Badge>
                      ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Preview
                </p>
                <div className="mt-3 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Preview text</Label>
                    <Input
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Type a line to preview…"
                      disabled={pending}
                    />
                    <p className="text-muted-foreground text-[11px]">
                      Tip: keep it short for faster playback.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedVoiceId || previewLoadingId === selectedVoiceId}
                    onClick={() =>
                      selectedVoiceId
                        ? void playPreview(selectedVoiceId, previewText.trim() || undefined)
                        : undefined
                    }
                  >
                    {previewLoadingId === selectedVoiceId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    Preview selected
                  </Button>

                  {previewError ? (
                    <p className="text-destructive text-xs">{previewError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {useVoiceIdManually ? (
            <>
              <div className="rounded-xl border bg-card p-4">
                <FormField
                  id="ca-voice-manual-id"
                  label="Custom Voice ID"
                  description="Paste an existing ElevenLabs custom voice ID, or upload a new one below."
                  error={errors.voiceManualId?.message}
                >
                  <Input
                    id="ca-voice-manual-id"
                    autoComplete="off"
                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                    disabled={pending}
                    aria-invalid={!!errors.voiceManualId}
                    {...register("voiceManualId")}
                  />
                </FormField>
              </div>

              <Separator />

              <div className="rounded-xl border bg-card p-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Custom voice
              </p>
              <p className="mt-1 text-sm font-semibold">Upload a custom voice sample</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Upload an audio sample to create a new ElevenLabs voice. After upload, we’ll switch to manual ID mode automatically.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs">Voice name</Label>
                <Input
                  placeholder="e.g. Clinic Receptionist"
                  value={customVoiceName}
                  onChange={(e) => setCustomVoiceName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Short note to identify this voice later…"
                  value={customVoiceDescription}
                  onChange={(e) => setCustomVoiceDescription(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Audio file</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCustomVoiceFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Supported: audio files (mp3/wav/m4a). Use clean speech for best quality.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={uploadingVoice || !customVoiceFile || !customVoiceName.trim()}
              onClick={() => void handleCustomVoiceUpload()}
              className="mt-3 w-full sm:w-auto"
            >
              {uploadingVoice ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload custom voice
            </Button>
            {uploadError ? <p className="text-destructive text-xs">{uploadError}</p> : null}
            {uploadSuccess ? <p className="text-emerald-600 text-xs">{uploadSuccess}</p> : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={voiceLibraryOpen} onOpenChange={setVoiceLibraryOpen}>
        <SheetContent className="w-full overflow-hidden p-0 sm:max-w-2xl">
          <div className="from-slate-200/40 via-indigo-200/25 to-slate-100/30 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 h-full bg-linear-to-br">
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle>Voice Library</SheetTitle>
              <SheetDescription>
                Browse all ElevenLabs voices, preview instantly, and select one.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 p-4">
              <Input
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                placeholder="Search voice by name, id, or label"
              />
              {voicesLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading voices...
                </div>
              ) : voiceLoadError ? (
                <div className="space-y-2">
                  <p className="text-destructive text-sm">{voiceLoadError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void loadVoices()}>
                    Retry loading voices
                  </Button>
                </div>
              ) : filteredVoices.length === 0 ? (
                <p className="text-muted-foreground text-sm">No voices match your search.</p>
              ) : (
                <div className="max-h-[65vh] space-y-2 overflow-y-auto rounded-md border bg-background/80 p-2">
                  {filteredVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${
                        selectedVoiceId === voice.id
                          ? "border-indigo-400 bg-indigo-500/10 dark:border-indigo-300 dark:bg-indigo-400/15"
                          : "border-border hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          setValue("voiceCatalogId", voice.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setVoiceLibraryOpen(false);
                        }}
                      >
                        <p className="truncate text-sm font-semibold">{voice.name}</p>
                        <p className="text-muted-foreground truncate text-xs">{voice.id}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(voice.labels ?? {})
                            .slice(0, 2)
                            .map(([k, v]) => (
                              <Badge
                                key={`${voice.id}-${k}`}
                                variant="secondary"
                                className="bg-slate-100 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                {k}: {v}
                              </Badge>
                            ))}
                        </div>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={previewLoadingId === voice.id}
                        onClick={() => void playPreview(voice.id)}
                      >
                        {previewLoadingId === voice.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                        Preview
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Card className="border-border/80 py-5 shadow-theme">
        <CardHeader className="pb-4 pt-0">
          <CardTitle className="text-base font-semibold tracking-tight">
            Advanced voice settings
          </CardTitle>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Sliders, latency, quality boosts, and automation.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground -mt-1 mb-1 text-xs font-medium">
            Voice controls
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="voiceStability"
              control={control}
              render={({ field }) => (
                <SliderField
                  id="ca-voice-stability"
                  label="Stability"
                  description="Lower = more variable; higher = steadier."
                  error={errors.voiceStability?.message}
                  min={0}
                  max={1}
                  step={0.01}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={pending}
                  minLabel={0}
                  maxLabel={1}
                  compact
                />
              )}
            />
            <Controller
              name="voiceSimilarity"
              control={control}
              render={({ field }) => (
                <SliderField
                  id="ca-voice-similarity"
                  label="Clarity + similarity"
                  description="Closeness to the reference timbre."
                  error={errors.voiceSimilarity?.message}
                  min={0}
                  max={1}
                  step={0.01}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={pending}
                  minLabel={0}
                  maxLabel={1}
                  compact
                />
              )}
            />
            <Controller
              name="voiceSpeed"
              control={control}
              render={({ field }) => (
                <SliderField
                  id="ca-voice-speed"
                  label="Speed"
                  description="Playback speed multiplier."
                  error={errors.voiceSpeed?.message}
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={pending}
                  formatValue={(v) => v.toFixed(2)}
                  minLabel={0.5}
                  maxLabel={2}
                  compact
                />
              )}
            />
            <Controller
              name="voiceStyleExaggeration"
              control={control}
              render={({ field }) => (
                <SliderField
                  id="ca-voice-style"
                  label="Style exaggeration"
                  description="Expressiveness vs. neutral delivery."
                  error={errors.voiceStyleExaggeration?.message}
                  min={0}
                  max={1}
                  step={0.01}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={pending}
                  minLabel={0}
                  maxLabel={1}
                  compact
                />
              )}
            />
          </div>

          <div className="border-border my-1 border-t pt-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              Streaming & behavior
            </p>
          </div>

          <FormField
            id="ca-streaming-latency"
            label="Optimize streaming latency"
            error={errors.optimizeStreamingLatency?.message}
          >
            <>
              <Controller
                name="optimizeStreamingLatency"
                control={control}
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as StreamingLatencyMode)
                    }
                    disabled={pending}
                  >
                    <SelectTrigger
                      id="ca-streaming-latency"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.optimizeStreamingLatency}
                    >
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAMING_LATENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {streamingHint ? (
                <p className="text-muted-foreground mt-1 text-[0.65rem] leading-relaxed">
                  {streamingHint}
                </p>
              ) : null}
            </>
          </FormField>

          <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Label
                htmlFor="ca-speaker-boost"
                className="text-foreground text-sm font-medium"
              >
                Speaker boost
              </Label>
              <p className="text-muted-foreground mt-0.5 text-[0.65rem] leading-relaxed">
                Clearer output on small speakers; may use more CPU.
              </p>
            </div>
            <Controller
              name="useSpeakerBoost"
              control={control}
              render={({ field }) => (
                <Switch
                  id="ca-speaker-boost"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={pending}
                  aria-label="Speaker boost"
                />
              )}
            />
          </div>

          <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Label
                htmlFor="ca-voice-auto-mode"
                className="text-foreground text-sm font-medium"
              >
                Auto mode
              </Label>
              <p className="text-muted-foreground mt-0.5 text-[0.65rem] leading-relaxed">
                Let the engine adjust voice settings from context.
              </p>
            </div>
            <Controller
              name="voiceAutoMode"
              control={control}
              render={({ field }) => (
                <Switch
                  id="ca-voice-auto-mode"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={pending}
                  aria-label="Auto mode"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Invalid file data"));
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
