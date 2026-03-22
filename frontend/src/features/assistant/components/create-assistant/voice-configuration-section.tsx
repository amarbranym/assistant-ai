"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { FormField } from "@/components/form/form-field";
import { SliderField } from "@/components/form/slider-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  STREAMING_LATENCY_OPTIONS,
  VOICE_CATALOG_COMBO_OPTIONS,
  VOICE_MODEL_COMBO_OPTIONS,
  VOICE_PROVIDER_COMBO_OPTIONS,
} from "@/features/assistant/lib/wizard-model-options";
import type {
  CreateAssistantFormValues,
  StreamingLatencyMode,
} from "@/features/assistant/schemas/create-assistant-form.schema";

export function VoiceConfigurationSection() {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<CreateAssistantFormValues>();
  const pending = isSubmitting;

  const useVoiceIdManually = useWatch({
    control,
    name: "useVoiceIdManually",
  });

  const streamingMode = useWatch({
    control,
    name: "optimizeStreamingLatency",
  });

  const streamingHint =
    STREAMING_LATENCY_OPTIONS.find((o) => o.value === streamingMode)?.hint ??
    "";

  return (
    <div className="space-y-6">
      <Card className="border-border/80 py-5 shadow-theme">
        <CardHeader className="pb-4 pt-0">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Voice
          </CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Choose provider, voice, and model. Use the Advanced tab for
            background audio and text chunking options.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="ca-voice-provider"
              label="Provider"
              error={errors.voiceProvider?.message}
            >
              <Controller
                name="voiceProvider"
                control={control}
                render={({ field }) => (
                  <SearchableCombobox
                    id="ca-voice-provider"
                    options={VOICE_PROVIDER_COMBO_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select provider (e.g. ElevenLabs)"
                    disabled={pending}
                  />
                )}
              />
            </FormField>
            <FormField
              id="ca-voice-model"
              label="Model"
              error={errors.voiceModel?.message}
            >
              <Controller
                name="voiceModel"
                control={control}
                render={({ field }) => (
                  <SearchableCombobox
                    id="ca-voice-model"
                    options={VOICE_MODEL_COMBO_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select voice model"
                    disabled={pending}
                  />
                )}
              />
            </FormField>
          </div>

          {useVoiceIdManually ? (
            <FormField
              id="ca-voice-manual-id"
              label="Voice ID"
              description="Paste the ID from your voice provider dashboard."
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
          ) : (
            <FormField
              id="ca-voice-catalog"
              label="Voice"
              error={errors.voiceCatalogId?.message}
            >
              <Controller
                name="voiceCatalogId"
                control={control}
                render={({ field }) => (
                  <SearchableCombobox
                    id="ca-voice-catalog"
                    options={VOICE_CATALOG_COMBO_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search voices…"
                    disabled={pending}
                  />
                )}
              />
            </FormField>
          )}

          <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Label
                htmlFor="ca-use-voice-id-manually"
                className="text-foreground text-sm font-medium"
              >
                Add voice ID manually
              </Label>
              <p className="text-muted-foreground mt-0.5 text-[0.65rem] leading-relaxed">
                Use a provider voice ID instead of the catalog.
              </p>
            </div>
            <Controller
              name="useVoiceIdManually"
              control={control}
              render={({ field }) => (
                <Switch
                  id="ca-use-voice-id-manually"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={pending}
                  aria-label="Add voice ID manually"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

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
