"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { FormField } from "@/components/form/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BACKGROUND_SOUND_COMBO_OPTIONS } from "@/features/assistant/lib/wizard-model-options";
import type { CreateAssistantFormValues } from "@/features/assistant/schemas/create-assistant-form.schema";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/80 py-5 shadow-theme">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className="text-base font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

export function AdvancedVoiceConfigurationSection() {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<CreateAssistantFormValues>();
  const pending = isSubmitting;

  return (
    <SectionCard
      title="Additional voice configuration"
      description="Optional audio bed, URL override, and text chunking hints."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="ca-bg-sound"
          label="Background sound"
          error={errors.backgroundSound?.message}
        >
          <Controller
            name="backgroundSound"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                disabled={pending}
              >
                <SelectTrigger
                  id="ca-bg-sound"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.backgroundSound}
                >
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {BACKGROUND_SOUND_COMBO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField
          id="ca-input-min-chars"
          label="Input min characters"
          error={errors.inputMinCharacters?.message}
        >
          <Input
            id="ca-input-min-chars"
            type="number"
            min={0}
            max={100000}
            disabled={pending}
            aria-invalid={!!errors.inputMinCharacters}
            {...register("inputMinCharacters", { valueAsNumber: true })}
          />
        </FormField>
    
      </div>
      <FormField
          id="ca-bg-sound-url"
          label="Background sound URL"
          description="Optional. Used when preset is Custom."
          error={errors.backgroundSoundUrl?.message}
        >
          <Input
            id="ca-bg-sound-url"
            type="url"
            autoComplete="off"
            placeholder="https://…"
            disabled={pending}
            aria-invalid={!!errors.backgroundSoundUrl}
            {...register("backgroundSoundUrl")}
          />
        </FormField>
        <FormField
          id="ca-punctuation-boundaries"
          label="Punctuation boundaries"
          description="Split long replies at these characters (e.g. . ! ?). One per line or comma-separated."
          error={errors.punctuationBoundaries?.message}
        >
          <Textarea
            id="ca-punctuation-boundaries"
            rows={3}
            className="min-h-14 resize-y"
            placeholder={`. ! ?`}
            disabled={pending}
            {...register("punctuationBoundaries")}
          />
        </FormField>
    </SectionCard>
  );
}
