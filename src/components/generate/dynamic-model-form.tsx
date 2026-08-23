"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Monitor, RectangleHorizontal, ScanFace, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import { estimateVideoCredits, estimateImageCredits } from "@/lib/credit-estimate";
import { buildDynamicSchema } from "@/lib/validation";
import type { CloudflareModelConfig } from "@/lib/cloudflare-models";
import { apiFetch } from "@/lib/api-client";
import {
  ComposerShell,
  ReferenceUploadRow,
  ReferenceUploadTile,
  ComposerPromptField,
  ProviderModelPicker,
  PillSelect,
  PillSlider,
  SettingsPopover,
  SettingRow,
  MobileOptionsTrigger,
  MobileFieldRow,
  CreditsSubmitPill,
  pillClass,
  type PickerModel,
} from "./composer";

const ENDPOINTS = {
  "text-to-video": "/api/generations/text-to-video",
  "text-to-image": "/api/generations/text-to-image",
  "image-to-video": "/api/generations/image-to-video",
} as const;

const SELECT_FIELD_ICONS: Record<string, LucideIcon> = {
  aspectRatio: RectangleHorizontal,
  resolution: Monitor,
  duration: Clock,
};

/**
 * One form, driven by a CloudflareModelConfig (see cloudflare-models.ts),
 * that serves every generic-registry live model instead of a bespoke form
 * per model — the parameter shapes vary too much across 15 models for
 * hand-written forms to scale (see Seedance's two bespoke forms, which this
 * deliberately doesn't replicate a third/fourth/fifth time of).
 *
 * Fields render as toolbar pills when they're a fixed "select" enum (or the
 * common "duration" number range); everything else — free text, unbounded
 * numbers, switches — lives inside the Settings pill's panel.
 */
export function DynamicModelForm<T extends string>({
  config,
  mode,
  models,
  model,
  onModelChange,
  initialPrompt,
  onPromptChange,
  onCreated,
  busy,
}: {
  config: CloudflareModelConfig;
  mode: keyof typeof ENDPOINTS;
  models: readonly PickerModel<T>[];
  model: T;
  onModelChange: (id: T) => void;
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const defaultValues: Record<string, unknown> = { prompt: initialPrompt };
  for (const field of config.fields) {
    if (field.defaultValue !== undefined) defaultValues[field.key] = field.defaultValue;
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(buildDynamicSchema(config)) as Resolver<Record<string, unknown>>,
    defaultValues,
  });

  const prompt = (watch("prompt") as string | undefined) ?? "";
  const duration = watch("duration");
  const resolution = watch("resolution");
  const image = watch("image") as string | undefined;
  const estimatedCredits =
    config.category === "text-to-image"
      ? estimateImageCredits(config.id)
      : estimateVideoCredits(
          config.id,
          typeof duration === "number" ? duration : parseInt(String(duration), 10) || 5,
          (resolution as string) ?? "720p",
        );

  async function handleFile(file: File) {
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setValue("image", json.url, { shouldValidate: true });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch(ENDPOINTS[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, model: config.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      return json;
    },
    onSuccess: (data) => {
      onCreated(data.id);
      invalidateCredits();
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't start generation", description: err.message, variant: "error" });
    },
  });

  const submit = handleSubmit((data) => mutation.mutate(data));

  const imageRequired = config.image === "required";
  const hasImage = config.image !== "none";
  const isVideoModel = config.category !== "text-to-image";

  const durationField = config.fields.find(
    (f) => f.key === "duration" && f.type === "number" && f.min !== undefined && f.max !== undefined,
  );
  const pillFields = config.fields.filter(
    (f) => f.type === "select" || f.key === durationField?.key,
  );
  const panelFields = config.fields.filter((f) => !pillFields.includes(f));

  return (
    <form onSubmit={submit} noValidate>
      <ComposerShell>
        {/* Stacked on mobile — see seedance-video-form.tsx for the full
            rationale. Desktop keeps them side by side. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {hasImage && (
            <div className="shrink-0">
              <ReferenceUploadRow>
                <ReferenceUploadTile
                  kind="image"
                  label={isVideoModel ? "Start Frame" : "Reference"}
                  shortLabel={isVideoModel ? "Start frame" : "Reference"}
                  optional={!imageRequired}
                  previewUrl={preview}
                  uploading={uploading}
                  onFile={handleFile}
                  onRemove={() => {
                    setPreview(null);
                    setValue("image", undefined, { shouldValidate: true });
                  }}
                  size="lg"
                />
              </ReferenceUploadRow>
            </div>
          )}

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="min-w-0 flex-1">
              <Controller
                control={control}
                name="prompt"
                render={({ field }) => (
                  <ComposerPromptField
                    value={(field.value as string) ?? ""}
                    onChange={(v) => {
                      field.onChange(v);
                      onPromptChange(v);
                    }}
                    onSubmit={submit}
                    placeholder={imageRequired ? "Describe the motion or scene changes…" : "Describe what to generate…"}
                    maxLength={2000}
                  />
                )}
              />
              {hasImage && (
                <FieldError>{!image ? (errors.image?.message as string | undefined) : undefined}</FieldError>
              )}
              <FieldError>{errors.prompt?.message as string | undefined}</FieldError>
            </div>

            <span className="mt-3 shrink-0 text-caption text-muted">{prompt.length}/2000</span>
          </div>
        </div>

        {/* Mobile: modality switcher + a single "Options" trigger that opens
            a BottomSheet with every pill/panel field, including the model
            picker — see seedance-video-form.tsx for the full rationale. */}
        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <ModalitySwitcherMobile type={mode} />
          <MobileOptionsTrigger onClick={() => setSheetOpen(true)} />
          <div className="ml-auto">
            <CreditsSubmitPill
              credits={estimatedCredits}
              loading={mutation.isPending || busy || uploading}
              disabled={imageRequired && !image}
            />
          </div>
        </div>

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Settings">
          <MobileFieldRow label="Model">
            <ProviderModelPicker models={models} value={model} onChange={onModelChange} />
          </MobileFieldRow>

          {isVideoModel && (
            <MobileFieldRow label="Characters" description="Coming soon — character consistency isn't wired up yet.">
              <ScanFace className="size-4 text-muted" aria-hidden="true" />
            </MobileFieldRow>
          )}

          {pillFields.map((field) =>
            field.key === durationField?.key ? (
              <MobileFieldRow key={field.key} label={field.label}>
                <PillSlider
                  icon={Clock}
                  label={field.label}
                  value={typeof duration === "number" ? duration : (field.defaultValue as number) ?? field.min!}
                  min={field.min!}
                  max={field.max!}
                  formatValue={(v) => `${v}s`}
                  onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                />
              </MobileFieldRow>
            ) : (
              <MobileFieldRow key={field.key} label={field.label}>
                <PillSelect
                  icon={SELECT_FIELD_ICONS[field.key] ?? SlidersHorizontal}
                  value={(watch(field.key) as string) ?? field.options?.[0] ?? ""}
                  options={field.options ?? []}
                  onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                />
              </MobileFieldRow>
            ),
          )}

          {panelFields.map((field) =>
            field.type === "switch" ? (
              <MobileFieldRow key={field.key} label={field.label} description={field.helperText}>
                <Controller
                  control={control}
                  name={field.key}
                  render={({ field: controllerField }) => (
                    <Switch
                      checked={Boolean(controllerField.value)}
                      onCheckedChange={controllerField.onChange}
                    />
                  )}
                />
              </MobileFieldRow>
            ) : (
              <div key={field.key} className="py-3.5">
                <label htmlFor={`dyn-${field.key}-mobile`} className="mb-1.5 block text-label text-ink-soft">
                  {field.label}
                </label>
                {field.type === "number" ? (
                  <Input
                    id={`dyn-${field.key}-mobile`}
                    type="number"
                    placeholder={field.helperText ?? "Random"}
                    {...register(field.key, {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                  />
                ) : (
                  <Input id={`dyn-${field.key}-mobile`} placeholder={field.helperText} {...register(field.key)} />
                )}
                {field.helperText && field.type !== "number" && (
                  <p className="mt-1.5 text-caption text-muted">{field.helperText}</p>
                )}
                <FieldError>{errors[field.key]?.message as string | undefined}</FieldError>
              </div>
            ),
          )}
        </BottomSheet>

        {/* Desktop: full pill row, scrolling horizontally instead of
            wrapping. Submit stays a sibling of the scroll area so it's
            always visible. */}
        <div className="mt-3 hidden items-center gap-2 sm:flex">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <ProviderModelPicker models={models} value={model} onChange={onModelChange} />

          {isVideoModel && (
            <Tooltip content="Coming soon — character consistency isn't wired up yet.">
              <span className="inline-flex" tabIndex={0}>
                <button type="button" disabled className={pillClass}>
                  <ScanFace className="size-3.5 text-muted" aria-hidden="true" />
                  Characters
                </button>
              </span>
            </Tooltip>
          )}

          {pillFields.map((field) =>
            field.key === durationField?.key ? (
              <PillSlider
                key={field.key}
                icon={Clock}
                label={field.label}
                value={typeof duration === "number" ? duration : (field.defaultValue as number) ?? field.min!}
                min={field.min!}
                max={field.max!}
                formatValue={(v) => `${v}s`}
                onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
              />
            ) : (
              <PillSelect
                key={field.key}
                icon={SELECT_FIELD_ICONS[field.key] ?? SlidersHorizontal}
                value={(watch(field.key) as string) ?? field.options?.[0] ?? ""}
                options={field.options ?? []}
                onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
              />
            ),
          )}

          {panelFields.length > 0 && (
            <SettingsPopover>
              {panelFields.map((field) =>
                field.type === "switch" ? (
                  <SettingRow key={field.key} title={field.label} description={field.helperText}>
                    <Controller
                      control={control}
                      name={field.key}
                      render={({ field: controllerField }) => (
                        <Switch
                          checked={Boolean(controllerField.value)}
                          onCheckedChange={controllerField.onChange}
                        />
                      )}
                    />
                  </SettingRow>
                ) : (
                  <div key={field.key}>
                    <label htmlFor={`dyn-${field.key}`} className="mb-1.5 block text-label text-ink-soft">
                      {field.label}
                    </label>
                    {field.type === "number" ? (
                      <Input
                        id={`dyn-${field.key}`}
                        type="number"
                        placeholder={field.helperText ?? "Random"}
                        {...register(field.key, {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    ) : (
                      <Input id={`dyn-${field.key}`} placeholder={field.helperText} {...register(field.key)} />
                    )}
                    {field.helperText && field.type !== "number" && (
                      <p className="mt-1.5 text-caption text-muted">{field.helperText}</p>
                    )}
                    <FieldError>{errors[field.key]?.message as string | undefined}</FieldError>
                  </div>
                ),
              )}
            </SettingsPopover>
          )}
        </div>

          <CreditsSubmitPill
            credits={estimatedCredits}
            loading={mutation.isPending || busy || uploading}
            disabled={imageRequired && !image}
          />
        </div>
      </ComposerShell>
    </form>
  );
}
