"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Mic, SlidersHorizontal, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";

import { FormField } from "@/components/form/form-field";
import { SliderField } from "@/components/form/slider-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATE_ASSISTANT_TABS,
  type CreateAssistantTabValue,
} from "@/features/assistant/lib/create-assistant-sections";
import { ASSISTANTS_ROUTE } from "@/features/assistant/lib/constants";
import { mapCreateFormToConfig } from "@/features/assistant/lib/map-create-form-to-config";
import {
  useCreateAssistantMutation,
  useUpdateAssistantMutation,
} from "@/features/assistant/hooks/use-assistants";
import {
  MODEL_PROVIDER_COMBO_OPTIONS,
  TOOL_LABELS,
  getModelIdOptionsForProvider,
} from "@/features/assistant/lib/wizard-model-options";
import { AdvancedVoiceConfigurationSection } from "@/features/assistant/components/create-assistant/advanced-voice-configuration-section";
import { VoiceConfigurationSection } from "@/features/assistant/components/create-assistant/voice-configuration-section";
import {
  FIRST_MESSAGE_MODE_OPTIONS,
  TOOL_IDS,
  createAssistantFormSchema,
  defaultCreateAssistantFormValues,
  type CreateAssistantFormValues,
  type FirstMessageMode,
} from "@/features/assistant/schemas/create-assistant-form.schema";

const TAB_ICONS: Record<CreateAssistantTabValue, LucideIcon> = {
  model: Bot,
  voice: Mic,
  tools: Wrench,
  advanced: SlidersHorizontal,
};

export type CreateAssistantFormProps = {
  variant?: "create" | "edit";
  assistantId?: string;
  /** Required for `variant="edit"` — usually derived from the loaded assistant row. */
  initialValues?: CreateAssistantFormValues;
};

function SectionCardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <CardHeader className="">
      <div>
        <CardTitle className="text-lg font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description && <p className="text-muted-foreground leading-relaxed text-sm ">{description}</p>}
      </div>
    </CardHeader>
  );
}

export function CreateAssistantForm({
  variant = "create",
  assistantId,
  initialValues,
}: CreateAssistantFormProps) {
  const router = useRouter();
  const isEdit = variant === "edit";

  const createMutation = useCreateAssistantMutation();
  const updateMutation = useUpdateAssistantMutation();

  const form = useForm<CreateAssistantFormValues>({
    resolver: zodResolver(
      createAssistantFormSchema,
    ) as Resolver<CreateAssistantFormValues>,
    defaultValues: initialValues ?? defaultCreateAssistantFormValues,
    mode: "onTouched",
  });

  const { control, register, handleSubmit, formState } = form;
  const { errors, isSubmitting } = formState;
  const pending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const mutationError = isEdit
    ? updateMutation.error
    : createMutation.error;

  const firstMessageMode = useWatch({
    control,
    name: "firstMessageMode",
  });
  const selectedModelProvider = useWatch({
    control,
    name: "modelProvider",
  });
  const selectedModelId = useWatch({
    control,
    name: "modelId",
  });

  const modelOptions = useMemo(
    () => getModelIdOptionsForProvider(selectedModelProvider),
    [selectedModelProvider]
  );

  useEffect(() => {
    const hasSelectedModel = modelOptions.some(
      (option) => option.value === selectedModelId
    );
    if (hasSelectedModel) return;
    const fallbackModel = modelOptions[0]?.value ?? "";
    form.setValue("modelId", fallbackModel, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [form, modelOptions, selectedModelId]);

  const [activeTab, setActiveTab] = useState<CreateAssistantTabValue>(
    CREATE_ASSISTANT_TABS[0].value,
  );

  async function onSubmit(values: CreateAssistantFormValues) {
    const config = mapCreateFormToConfig(values);
    if (isEdit && assistantId) {
      try {
        await updateMutation.mutateAsync({
          id: assistantId,
          input: {
            name: values.name.trim(),
            description: values.description?.trim() || "",
            active: values.active,
            config,
          },
        });
        router.push(ASSISTANTS_ROUTE);
      } catch {
        /* surfaced via mutationError */
      }
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        config,
      });
      router.push(ASSISTANTS_ROUTE);
    } catch {
      /* surfaced via mutationError */
    }
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full pb-6"
        noValidate
      >
        {mutationError ? (
          <p className="text-destructive mb-4 text-sm" role="alert">
            {mutationError instanceof Error
              ? mutationError.message
              : "Something went wrong."}
          </p>
        ) : null}
        <Tabs
          value={activeTab}
          onValueChange={(next) => {
            setActiveTab(next as CreateAssistantTabValue);
          }}
          className="w-full"
        >
          <div className="border-border bg-background sticky top-0 z-30 touch-manipulation border-b  pb-px ">
            <TabsList
              aria-label="Assistant configuration sections"
              className="w-full justify-start gap-2 border-0 bg-transparent p-0 sm:gap-3"
            >
              {CREATE_ASSISTANT_TABS.map((tab) => {
                const Icon = TAB_ICONS[tab.value];
                return (
                  <TabsTrigger key={tab.value} value={tab.value} >
                    <Icon
                      className="size-3.5 shrink-0 opacity-80"
                      aria-hidden
                    />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="model" >
            <Card className="border-border/80 py-5 shadow-theme">
              <SectionCardHeader title="Model" description="Choose the model to use for your assistant." />
              <CardContent className="space-y-5">
                <FormField
                    id="ca-name"
                    label="Assistant name"
                    error={errors.name?.message}
                  >
                    <Input
                      id="ca-name"
                      autoComplete="off"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                  </FormField>
                
                <FormField
                    id="ca-description"
                    label="Description (optional)"
                    error={errors.description?.message}
                  >
                    <Textarea
                      id="ca-description"
                      autoComplete="off"
                      rows={3}
                      aria-invalid={!!errors.description}
                      {...register("description")}
                    />
                  </FormField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="ca-model-provider"
                    label="Provider"
                    error={errors.modelProvider?.message}
                  >
                    <Controller
                      name="modelProvider"
                      control={control}
                      render={({ field }) => (
                        <SearchableCombobox
                          id="ca-model-provider"
                          options={MODEL_PROVIDER_COMBO_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select provider"
                          disabled={pending}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    id="ca-model-id"
                    label="Model"
                    error={errors.modelId?.message}
                  >
                    <Controller
                      name="modelId"
                      control={control}
                      render={({ field }) => (
                        <SearchableCombobox
                          id="ca-model-id"
                          options={modelOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select model"
                          disabled={pending}
                        />
                      )}
                    />
                  </FormField>
                </div>

                <FormField
                  id="ca-first-message-mode"
                  label="First message mode"
                  error={errors.firstMessageMode?.message}
                >
                  <Controller
                    name="firstMessageMode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v as FirstMessageMode)
                        }
                        disabled={pending}
                      >
                        <SelectTrigger
                          id="ca-first-message-mode"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!errors.firstMessageMode}
                        >
                          <SelectValue placeholder="Select first message mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIRST_MESSAGE_MODE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                {firstMessageMode === "assistant_custom" ? (
                  <FormField
                    id="ca-first-message"
                    label="Custom first message"
                    error={errors.firstMessage?.message}
                  >
                    <Input
                      id="ca-first-message"
                      autoComplete="off"
                      placeholder="e.g. Hi! How can I help you today?"
                      disabled={pending}
                      aria-invalid={!!errors.firstMessage}
                      {...register("firstMessage")}
                    />
                  </FormField>
                ) : null}

                <FormField
                  id="ca-system-prompt"
                  label="System prompt"
                  error={errors.systemPrompt?.message}
                >
                  <Textarea
                    id="ca-system-prompt"
                    rows={5}
                    className="min-h-24 resize-y"
                    disabled={pending}
                    {...register("systemPrompt")}
                  />
                </FormField>

                <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
                  <FormField
                    id="ca-max-tokens"
                    label="Max tokens"
                    error={errors.maxTokens?.message}
                  >
                    <Input
                      id="ca-max-tokens"
                      type="number"
                      min={256}
                      max={200000}
                      disabled={pending}
                      aria-invalid={!!errors.maxTokens}
                      {...register("maxTokens", { valueAsNumber: true })}
                    />
                  </FormField>
                  <Controller
                    name="temperature"
                    control={control}
                    render={({ field }) => (
                      <SliderField
                        id="ca-temperature"
                        label="Temperature"
                        // description="Sampling randomness (0 = focused, 2 = creative)."
                        error={errors.temperature?.message}
                        min={0}
                        max={2}
                        step={0.05}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={pending}
                      />
                    )}
                  />
                </div>

                {isEdit ? (
                  <FormField
                    id="ca-active"
                    label="Assistant status"
                    error={errors.active?.message}
                  >
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-3">
                          <Switch
                            id="ca-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={pending}
                            aria-invalid={!!errors.active}
                          />
                          <span className="text-muted-foreground text-sm">
                            {field.value
                              ? "Active — chat and talk are available"
                              : "Inactive — conversations stay disabled"}
                          </span>
                        </div>
                      )}
                    />
                  </FormField>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className=" gap-0">
            <VoiceConfigurationSection />
          </TabsContent>

          <TabsContent value="tools">
            <Card className="border-border/80 py-5 shadow-theme">
              <SectionCardHeader title="Tools" description="Choose the tools to use for your assistant." />
              <CardContent className="space-y-0">
                <ul className="divide-border divide-y rounded-lg border">
                  {TOOL_IDS.map((id) => (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-4 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium">
                          {TOOL_LABELS[id] ?? id}
                        </p>
                      </div>
                      <Controller
                        name={`tools.${id}`}
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={pending}
                            aria-label={`Enable ${TOOL_LABELS[id] ?? id}`}
                          />
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-8 gap-0">
            <AdvancedVoiceConfigurationSection />
          </TabsContent>
        </Tabs>

        <div className="border-border mt-7 flex justify-end ">
          <Button type="submit" disabled={pending} className="min-w-40">
            {pending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create assistant"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
