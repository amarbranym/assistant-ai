"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Bot, Mic, Phone, SlidersHorizontal, Wrench } from "lucide-react";
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
import { useFieldArray, useFormContext } from "react-hook-form";

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
import { Separator } from "@/components/ui/separator";
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
import { KnowledgeConfigurationSection } from "@/features/assistant/components/create-assistant/knowledge-configuration-section";
import { loadToolsFromStorage } from "@/features/tools/lib/tools-storage";
import type { ManagedTool } from "@/features/tools/types";
import {
  FIRST_MESSAGE_MODE_OPTIONS,
  TOOL_IDS,
  createAssistantFormSchema,
  defaultCreateAssistantFormValues,
  type CreateAssistantFormValues,
  type FirstMessageMode,
} from "@/features/assistant/schemas/create-assistant-form.schema";

function CustomHeadersEditor({ disabled }: { disabled: boolean }) {
  const { control, register } = useFormContext<CreateAssistantFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "customApiHeaders"
  });

  return (
    <div className="mt-3 space-y-2">
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-xs">No headers added.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="Header key (e.g. Authorization)"
                disabled={disabled}
                {...register(`customApiHeaders.${i}.key`)}
              />
              <Input
                placeholder="Header value"
                disabled={disabled}
                {...register(`customApiHeaders.${i}.value`)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => remove(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => append({ key: "", value: "" })}
      >
        Add header
      </Button>
    </div>
  );
}

function ConfigParamsEditor({
  title,
  rows,
  onChange
}: {
  title: string;
  rows: Array<{ id: string; key: string; value: string; required: boolean }>;
  onChange: (next: Array<{ id: string; key: string; value: string; required: boolean }>) => void;
}) {
  const add = () =>
    onChange([...rows, { id: crypto.randomUUID(), key: "", value: "", required: false }]);

  const update = (
    id: string,
    patch: Partial<{ id: string; key: string; value: string; required: boolean }>
  ) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          Add
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">No {title.toLowerCase()}.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                placeholder="Key"
                value={row.key}
                onChange={(e) => update(row.id, { key: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={row.value}
                onChange={(e) => update(row.id, { value: e.target.value })}
              />
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <Switch
                  checked={row.required}
                  onCheckedChange={(v) => update(row.id, { required: v })}
                />
                Required
              </label>
              <Button type="button" variant="outline" size="sm" onClick={() => remove(row.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_ICONS: Record<CreateAssistantTabValue, LucideIcon> = {
  channels: Phone,
  model: Bot,
  voice: Mic,
  knowledge: BookOpen,
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
  const [managedTools, setManagedTools] = useState<ManagedTool[]>([]);
  const linkedToolIds = useWatch({ control, name: "linkedToolIds" });
  const assistantToolConfigs = useWatch({ control, name: "assistantToolConfigs" });
  const customApiEnabled = useWatch({ control, name: "tools.custom_api" });
  const channelsPhoneEnabled = useWatch({ control, name: "channelsPhoneEnabled" });
  const channelsWhatsappEnabled = useWatch({ control, name: "channelsWhatsappEnabled" });
  const [activeToolConfigId, setActiveToolConfigId] = useState<string | null>(null);

  useEffect(() => {
    setManagedTools(loadToolsFromStorage().filter((t) => !t.isInternal));
  }, []);

  useEffect(() => {
    const configs = assistantToolConfigs ?? [];
    if (configs.length === 0) {
      setActiveToolConfigId(null);
      return;
    }
    if (!activeToolConfigId || !configs.some((cfg) => cfg.toolId === activeToolConfigId)) {
      setActiveToolConfigId(configs[0]?.toolId ?? null);
    }
  }, [assistantToolConfigs, activeToolConfigId]);

  const activeToolConfigIndex = (assistantToolConfigs ?? []).findIndex(
    (cfg) => cfg.toolId === activeToolConfigId
  );
  const activeToolConfig =
    activeToolConfigIndex >= 0 ? (assistantToolConfigs ?? [])[activeToolConfigIndex] : undefined;

  const upsertAssistantToolConfig = (tool: ManagedTool) => {
    const existing = assistantToolConfigs ?? [];
    if (existing.some((x) => x.toolId === tool.id)) return;
    form.setValue(
      "assistantToolConfigs",
      [
        ...existing,
        {
          toolId: tool.id,
          name: tool.name,
          provider: tool.provider,
          enabled: true,
          endpointUrl: tool.endpointUrl ?? "",
          authType: tool.authType,
          authValue: tool.authValue ?? "",
          params: tool.params.map((p) => ({
            id: p.id || crypto.randomUUID(),
            key: p.key,
            value: p.value,
            required: p.required
          })),
          headers: tool.baseHeaders.map((h) => ({
            id: h.id || crypto.randomUUID(),
            key: h.key,
            value: h.value,
            required: h.required
          }))
        }
      ],
      { shouldDirty: true }
    );
  };

  const removeAssistantToolConfig = (toolId: string) => {
    form.setValue(
      "assistantToolConfigs",
      (assistantToolConfigs ?? []).filter((x) => x.toolId !== toolId),
      { shouldDirty: true }
    );
  };

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

          <TabsContent value="channels">
            <Card className="border-border/80 py-5 shadow-theme">
              <SectionCardHeader
                title="Channels"
                description="Choose where this assistant will communicate and configure each channel."
              />
              <CardContent className="space-y-6">
                <div className="rounded-xl border bg-linear-to-r from-slate-50 to-indigo-50 px-4 py-3 dark:from-slate-950/40 dark:to-indigo-950/20">
                  <p className="text-sm font-semibold">Deployment channels</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Configure production-ready channel credentials. Enable one or both channels based on your deployment plan.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border bg-background px-2 py-0.5">
                      1) Enable channel
                    </span>
                    <span className="rounded-full border bg-background px-2 py-0.5">
                      2) Add provider credentials
                    </span>
                    <span className="rounded-full border bg-background px-2 py-0.5">
                      3) Publish after checks pass
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Phone (Twilio)</p>
                        <p className="text-muted-foreground text-xs">Voice calls and optional SMS messaging</p>
                      </div>
                      <Controller
                        name="channelsPhoneEnabled"
                        control={control}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>

                    {channelsPhoneEnabled ? (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border bg-muted/25 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Twilio configuration
                          </p>
                        </div>
                        <FormField
                          id="ca-channel-twilio-phone-number"
                          label="Twilio Phone Number"
                          error={errors.channelsTwilioPhoneNumber?.message}
                        >
                          <Input
                            id="ca-channel-twilio-phone-number"
                            placeholder="+14156021922"
                            {...register("channelsTwilioPhoneNumber")}
                          />
                        </FormField>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormField
                            id="ca-channel-twilio-account-sid"
                            label="Twilio Account SID"
                            error={errors.channelsTwilioAccountSid?.message}
                          >
                            <Input
                              id="ca-channel-twilio-account-sid"
                              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              {...register("channelsTwilioAccountSid")}
                            />
                          </FormField>
                          <FormField
                            id="ca-channel-twilio-auth-token"
                            label="Twilio Auth Token"
                            error={errors.channelsTwilioAuthToken?.message}
                          >
                            <Input
                              id="ca-channel-twilio-auth-token"
                              type="password"
                              placeholder="Twilio Auth Token"
                              {...register("channelsTwilioAuthToken")}
                            />
                          </FormField>
                        </div>
                        <FormField id="ca-channel-twilio-label" label="Label (optional)">
                          <Input
                            id="ca-channel-twilio-label"
                            placeholder="Label for Phone Number"
                            {...register("channelsTwilioLabel")}
                          />
                        </FormField>
                        <div className="rounded-lg border bg-muted/20 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">SMS Enabled</p>
                              <p className="text-muted-foreground text-xs">
                                Enable SMS messaging for this phone number
                              </p>
                            </div>
                            <Controller
                              name="channelsTwilioSmsEnabled"
                              control={control}
                              render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-xs">
                        Enable this channel to enter Twilio credentials.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">WhatsApp channel</p>
                        <p className="text-muted-foreground text-xs">Business messaging entry point</p>
                      </div>
                      <Controller
                        name="channelsWhatsappEnabled"
                        control={control}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>

                    {channelsWhatsappEnabled ? (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border bg-muted/25 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            WhatsApp sender profile
                          </p>
                        </div>
                        <FormField
                          id="ca-channel-whatsapp-number"
                          label="WhatsApp number"
                          error={errors.channelsWhatsappNumber?.message}
                        >
                          <Input
                            id="ca-channel-whatsapp-number"
                            placeholder="+1 555 000 0000"
                            {...register("channelsWhatsappNumber")}
                          />
                        </FormField>
                        <FormField id="ca-channel-whatsapp-name" label="Business display name (optional)">
                          <Input
                            id="ca-channel-whatsapp-name"
                            placeholder="Acme Support"
                            {...register("channelsWhatsappBusinessName")}
                          />
                        </FormField>
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-xs">
                        Enable to configure WhatsApp sender details.
                      </p>
                    )}
                  </div>
                </div>

                {errors.channelsPhoneEnabled?.message ? (
                  <p className="text-destructive text-sm">
                    {errors.channelsPhoneEnabled.message}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className=" gap-0">
            <VoiceConfigurationSection />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfigurationSection assistantId={isEdit ? assistantId : undefined} />
          </TabsContent>

          <TabsContent value="tools">
            <Card className="border-border/80 py-5 shadow-theme">
              <SectionCardHeader title="Tools" description="Choose the tools to use for your assistant." />
              <CardContent className="space-y-0">
                <div className="mb-5 rounded-xl border bg-card p-4">
                  <p className="text-sm font-semibold">Connected tools library</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Select tools from your Tools Manager to link with this assistant.
                  </p>
                  <div className="mt-3 space-y-2">
                    {managedTools.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No user-managed tools found in Tools Manager.</p>
                    ) : (
                      managedTools.map((tool) => {
                        const linked = (linkedToolIds ?? []).includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{tool.name}</p>
                              <p className="text-muted-foreground truncate text-xs">{tool.provider}</p>
                            </div>
                            <Switch
                              checked={linked}
                              onCheckedChange={(next) => {
                                const current = linkedToolIds ?? [];
                                const newIds = next
                                  ? [...current, tool.id]
                                  : current.filter((id) => id !== tool.id);
                                form.setValue("linkedToolIds", newIds, { shouldDirty: true });
                                if (next) {
                                  upsertAssistantToolConfig(tool);
                                  setActiveToolConfigId(tool.id);
                                } else {
                                  removeAssistantToolConfig(tool.id);
                                  if (activeToolConfigId === tool.id) {
                                    setActiveToolConfigId(null);
                                  }
                                }
                                if (tool.provider === "custom" && next && tool.endpointUrl) {
                                  form.setValue("tools.custom_api", true, { shouldDirty: true });
                                  form.setValue("customApiUrl", tool.endpointUrl, { shouldDirty: true, shouldValidate: true });
                                  form.setValue(
                                    "customApiRequiredFields",
                                    tool.params
                                      .filter((p) => p.required && p.key.trim())
                                      .map((p) => p.key.trim())
                                      .join(","),
                                    { shouldDirty: true }
                                  );
                                  form.setValue(
                                    "customApiHeaders",
                                    tool.baseHeaders.map((h) => ({ key: h.key, value: h.value })),
                                    { shouldDirty: true }
                                  );
                                }
                              }}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mb-5 rounded-xl border bg-card p-4">
                  <p className="text-sm font-semibold">Assistant-specific configuration</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Keep defaults in Tools Manager, then set per-assistant overrides here.
                  </p>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Connected tools</span>
                      <p className="text-sm font-semibold">{(assistantToolConfigs ?? []).length}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Enabled for runtime</span>
                      <p className="text-sm font-semibold">
                        {(assistantToolConfigs ?? []).filter((cfg) => cfg.enabled).length}
                      </p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Custom API linked</span>
                      <p className="text-sm font-semibold">
                        {(assistantToolConfigs ?? []).some((cfg) => cfg.provider === "custom")
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  </div>

                  {(assistantToolConfigs ?? []).length > 0 ? (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(assistantToolConfigs ?? []).map((cfg) => (
                          <Button
                            key={cfg.toolId}
                            type="button"
                            size="sm"
                            variant={activeToolConfigId === cfg.toolId ? "default" : "outline"}
                            onClick={() => setActiveToolConfigId(cfg.toolId)}
                          >
                            {cfg.name}
                          </Button>
                        ))}
                      </div>

                      {activeToolConfig ? (
                        <div className="mt-4 rounded-lg border p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{activeToolConfig.name}</p>
                              <p className="text-muted-foreground text-xs capitalize">
                                {activeToolConfig.provider} configuration
                              </p>
                            </div>
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={activeToolConfig.enabled}
                                onCheckedChange={(next) =>
                                  form.setValue(
                                    `assistantToolConfigs.${activeToolConfigIndex}.enabled`,
                                    next,
                                    { shouldDirty: true }
                                  )
                                }
                              />
                              Enabled
                            </label>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                              label="Endpoint URL"
                              id={`tool-endpoint-${activeToolConfig.toolId}`}
                            >
                              <Input
                                value={activeToolConfig.endpointUrl}
                                placeholder="https://api.yourdomain.com/action"
                                onChange={(e) =>
                                  form.setValue(
                                    `assistantToolConfigs.${activeToolConfigIndex}.endpointUrl`,
                                    e.target.value,
                                    { shouldDirty: true }
                                  )
                                }
                              />
                            </FormField>
                            <FormField
                              label="Authentication"
                              id={`tool-auth-type-${activeToolConfig.toolId}`}
                            >
                              <Select
                                value={activeToolConfig.authType}
                                onValueChange={(v) =>
                                  form.setValue(
                                    `assistantToolConfigs.${activeToolConfigIndex}.authType`,
                                    v as "none" | "api_key" | "bearer",
                                    { shouldDirty: true }
                                  )
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
                            </FormField>
                            {activeToolConfig.authType !== "none" ? (
                              <div className="sm:col-span-2">
                                <FormField
                                  label="Auth value"
                                  id={`tool-auth-value-${activeToolConfig.toolId}`}
                                >
                                  <Input
                                    value={activeToolConfig.authValue}
                                    placeholder="Enter auth credential"
                                    onChange={(e) =>
                                      form.setValue(
                                        `assistantToolConfigs.${activeToolConfigIndex}.authValue`,
                                        e.target.value,
                                        { shouldDirty: true }
                                      )
                                    }
                                  />
                                </FormField>
                              </div>
                            ) : null}
                          </div>

                          <details className="mt-3 rounded-md border bg-muted/20 px-3 py-2">
                            <summary className="cursor-pointer text-xs font-medium">
                              Advanced fields (parameters and headers)
                            </summary>
                            <ConfigParamsEditor
                              title="Parameters"
                              rows={activeToolConfig.params}
                              onChange={(rows) =>
                                form.setValue(
                                  `assistantToolConfigs.${activeToolConfigIndex}.params`,
                                  rows,
                                  { shouldDirty: true }
                                )
                              }
                            />
                            <ConfigParamsEditor
                              title="Headers"
                              rows={activeToolConfig.headers}
                              onChange={(rows) =>
                                form.setValue(
                                  `assistantToolConfigs.${activeToolConfigIndex}.headers`,
                                  rows,
                                  { shouldDirty: true }
                                )
                              }
                            />
                          </details>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-xs">
                      Connect at least one tool above to configure assistant-specific settings.
                    </p>
                  )}
                </div>

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

                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider">
                      Custom API
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-semibold">Webhook configuration</p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      When enabled, the assistant can call your webhook. In Test Mode, calls are simulated.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <FormField
                        id="ca-custom-api-url"
                        label="Webhook URL"
                        error={errors.customApiUrl?.message}
                      >
                        <Input
                          id="ca-custom-api-url"
                          placeholder="https://yourdomain.com/webhook"
                          disabled={pending || !customApiEnabled}
                          {...register("customApiUrl")}
                        />
                      </FormField>

                      <FormField id="ca-custom-api-method" label="Method">
                        <Controller
                          name="customApiMethod"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={pending || !customApiEnabled}
                            >
                              <SelectTrigger id="ca-custom-api-method">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>

                      <div className="sm:col-span-2">
                        <FormField
                          id="ca-custom-api-required"
                          label="Required fields (comma-separated)"
                        >
                          <Input
                            id="ca-custom-api-required"
                            placeholder="name,email,phone"
                            disabled={pending || !customApiEnabled}
                            {...register("customApiRequiredFields")}
                          />
                        </FormField>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          Example: if required fields are missing, assistant will ask for them one-by-one before calling.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold">Headers</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Optional static headers (e.g. Authorization). Do not paste secrets if you plan to share screenshots.
                      </p>

                      <CustomHeadersEditor
                        disabled={pending || !customApiEnabled}
                      />
                    </div>
                  </div>
                </div>
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
