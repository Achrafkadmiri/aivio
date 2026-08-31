"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits, useUsage } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Gauge,
  Maximize,
  Monitor,
  Palette,
  RectangleHorizontal,
  ScanFace,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  Clock,
  Gauge,
  Maximize,
  Monitor,
  Palette,
  RectangleHorizontal,
  ScanFace,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import {
  estimateVideoCredits,
  estimateImageCredits,
  imageSettingsFromParameters,
} from "@/lib/credit-estimate";
import { buildDynamicSchema } from "@/lib/validation";
import type { CloudflareModelConfig } from "@/lib/cloudflare-models";
import { apiFetch } from "@/lib/api-client";
import {
  isResolutionLocked,
  isDurationLocked,
  bestAllowedResolution,
  bestAllowedDuration,
  minTierForResolution,
  minTierForDuration,
  upgradeHint,
} from "@/lib/tier-limits";
import {
  TIER_MANAGED_FIELD_KEYS,
  comparePrimaryFieldKeys,
  isPrimaryFieldKey,
  valueHint,
} from "@/lib/composer-fields";
import { applyImageStyle } from "@/lib/image-styles";
import { IMAGE_STYLE_PRESETS, type TierInfo } from "@/lib/constants";
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
  size: Maximize,
  imageSize: Maximize,
  quality: Gauge,
};

/** "None" first so the pill can express "no style applied" without a
 * separate clear affordance. */
const STYLE_OPTIONS = ["None", ...IMAGE_STYLE_PRESETS] as const;
type StyleOption = (typeof STYLE_OPTIONS)[number];

/** Duration is a *select* on some models rather than the numeric range
 * PillSlider handles — veo-3.1 spells its options "4s"/"6s"/"8s" and
 * hailuo-2.3 spells them "6"/"10". Both parse the same way, and both need it:
 * the slider's tier cap never applied to a select, so those options were
 * freely pickable and then rejected server-side with a 403. */
function durationOptionSeconds(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

/** "6" -> "6s", "8s" -> "8s" — for wording an upgrade hint on either spelling. */
function durationOptionLabel(value: string | number): string {
  const raw = String(value);
  return /s$/.test(raw) ? raw : `${raw}s`;
}

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
  tierInfo,
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
  /** Current plan's limits — undefined while still loading, and irrelevant
   * for text-to-image models (only video resolution is tier-gated server
   * side, see aiVideo-backend's generations.ts). */
  tierInfo?: TierInfo;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  // Same ["usage"] query the generate workspace already runs, so this is a
  // cache read, not a second request. Only the balance is taken from it —
  // plan limits still arrive as the tierInfo prop.
  const usage = useUsage();
  const creditBalance = usage.data?.credit_balance;
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Image style is a composer-level control, not a model field: it folds into
  // the prompt on submit (see applyImageStyle) rather than travelling as a
  // parameter, because the backend builds parameters strictly from the model
  // registry and no image model here takes a generic style argument.
  const [style, setStyle] = useState<StyleOption>("None");

  const isVideoModel = config.category !== "text-to-image";
  const isImageModel = !isVideoModel;
  const imageRequired = config.image === "required";
  const hasImage = config.image !== "none";

  const defaultValues: Record<string, unknown> = { prompt: initialPrompt };
  for (const field of config.fields) {
    if (field.defaultValue !== undefined) defaultValues[field.key] = field.defaultValue;
  }

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(buildDynamicSchema(config)) as Resolver<Record<string, unknown>>,
    defaultValues,
  });

  // Subscribes to every field at once. The prompt already re-renders this on
  // each keystroke, so nothing is lost by it, and it lets the image cost below
  // read whichever key a given model spells its size with using the exact same
  // rule the server bills by (imageSettingsFromParameters).
  const values = watch();
  const prompt = (values.prompt as string | undefined) ?? "";
  const duration = values.duration;
  const resolution = values.resolution;
  const image = values.image as string | undefined;

  // Images used to bill a flat per-model figure, so the Size/Resolution/
  // Quality pill sat directly beside the cost and the number never moved even
  // between 1K and 4K. Both sides now scale off the picked settings — see
  // estimateImageCredits, and createGenerationJob in the backend, which reads
  // the same keys back out of the saved parameters.
  const estimatedCredits = isImageModel
    ? estimateImageCredits(config.id, imageSettingsFromParameters(values))
    : estimateVideoCredits(
        config.id,
        typeof duration === "number" ? duration : durationOptionSeconds(String(duration)) || 5,
        (resolution as string) ?? "720p",
      );

  const durationField = config.fields.find(
    (f) => f.key === "duration" && f.type === "number" && f.min !== undefined && f.max !== undefined,
  );
  // Enum options for the two fields a plan can actually gate, when the model
  // spells them as selects. Memoised so the clamping effect below doesn't see
  // a fresh array identity on every render.
  const resolutionOptions = useMemo(
    () => config.fields.find((f) => f.key === "resolution" && f.type === "select")?.options ?? [],
    [config],
  );
  const durationOptions = useMemo(
    () => config.fields.find((f) => f.key === "duration" && f.type === "select")?.options ?? [],
    [config],
  );

  // Every model in the registry defaults to 720p or above, and several default
  // to a clip longer than the free plan's 5s cap — so the composer opened
  // pre-filled with a value the server would reject, and the only feedback was
  // a 403 after pressing Generate. tierInfo arrives async (it rides the usage
  // query), well after react-hook-form has taken its defaults, so the
  // correction happens here rather than in defaultValues.
  useEffect(() => {
    if (!isVideoModel || !tierInfo) return;
    const currentResolution = getValues("resolution");
    if (typeof currentResolution === "string" && isResolutionLocked(currentResolution, tierInfo)) {
      const allowed = bestAllowedResolution(resolutionOptions, tierInfo);
      if (allowed) setValue("resolution", allowed, { shouldValidate: true });
    }
    const currentDuration = getValues("duration");
    if (currentDuration === undefined) return;
    if (durationOptions.length > 0) {
      if (isDurationLocked(durationOptionSeconds(currentDuration as string), tierInfo)) {
        const allowed = bestAllowedDuration(durationOptions, durationOptionSeconds, tierInfo);
        if (allowed) setValue("duration", allowed, { shouldValidate: true });
      }
    } else if (typeof currentDuration === "number" && isDurationLocked(currentDuration, tierInfo)) {
      // The slider only ever clamped what it DISPLAYED (Math.min(value,
      // durationCap)) — the form value stayed at the model default, so both
      // the estimate and the submitted payload could sit above the cap.
      setValue("duration", tierInfo.maxDurationSeconds, { shouldValidate: true });
    }
  }, [tierInfo, isVideoModel, resolutionOptions, durationOptions, getValues, setValue]);

  // A model can offer nothing the plan is allowed to run (Veo 3.1 starts at
  // 720p; the free plan stops at 480p), in which case the clamp above has no
  // fallback and the pick stays locked. Say so on the submit button rather
  // than letting it 403.
  const lockedResolution =
    isVideoModel && typeof resolution === "string" && isResolutionLocked(resolution, tierInfo)
      ? resolution
      : undefined;
  const lockedDuration =
    isVideoModel &&
    durationOptions.length > 0 &&
    duration !== undefined &&
    isDurationLocked(durationOptionSeconds(duration as string), tierInfo)
      ? duration
      : undefined;
  const blockedReason = lockedResolution
    ? upgradeHint(minTierForResolution(lockedResolution), lockedResolution)
    : lockedDuration !== undefined
      ? upgradeHint(
          minTierForDuration(durationOptionSeconds(lockedDuration as string)),
          durationOptionLabel(lockedDuration as string) + " clips",
        )
      : undefined;

  /** Per-option tier gates. Resolution and duration are the only two fields a
   *  plan caps; everything else is the model's own business. */
  function optionLock(fieldKey: string): ((value: string) => boolean) | undefined {
    if (!isVideoModel) return undefined;
    if (fieldKey === "resolution") return (v) => isResolutionLocked(v, tierInfo);
    if (fieldKey === "duration") return (v) => isDurationLocked(durationOptionSeconds(v), tierInfo);
    return undefined;
  }

  function optionLockHint(fieldKey: string): ((value: string) => string) | undefined {
    if (!isVideoModel) return undefined;
    if (fieldKey === "resolution") return (v) => upgradeHint(minTierForResolution(v), v);
    if (fieldKey === "duration") {
      return (v) =>
        upgradeHint(minTierForDuration(durationOptionSeconds(v)), durationOptionLabel(v) + " clips");
    }
    return undefined;
  }

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

  const submit = handleSubmit((data) =>
    mutation.mutate(
      isImageModel && style !== "None"
        ? { ...data, prompt: applyImageStyle(String(data.prompt ?? ""), style) }
        : data,
    ),
  );

  // The toolbar carries only the choices that change the result (and the
  // price); everything else stays one click away under Settings. Before this
  // every select became a pill, so an output-format picker sat next to the
  // resolution and the row's shape changed completely from model to model.
  // TIER_MANAGED_FIELD_KEYS drops what the plan decides rather than the user
  // (watermark) - its default still reaches the provider, see composer-fields.ts.
  const visibleFields = config.fields.filter((f) => !TIER_MANAGED_FIELD_KEYS.has(f.key));
  const pillFields = visibleFields
    .filter((f) => (f.type === "select" || f.key === durationField?.key) && isPrimaryFieldKey(f.key))
    .sort((a, b) => comparePrimaryFieldKeys(a.key, b.key));
  const panelFields = visibleFields.filter((f) => !pillFields.includes(f));

  // Clamps the duration slider to the current plan's limit (undefined
  // tierInfo — still loading — leaves the model's own max in place).
  const durationModelMax = durationField?.max ?? 0;
  const durationCap = tierInfo ? Math.min(durationModelMax, tierInfo.maxDurationSeconds) : durationModelMax;
  const durationCapped = tierInfo ? durationCap < durationModelMax : false;

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
                    placeholder={
                      imageRequired
                        ? "Describe the motion or scene changes…"
                        : isImageModel
                          ? "Describe the image you imagine"
                          : "Describe the scene you imagine"
                    }
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
              balance={creditBalance}
              blockedReason={blockedReason}
            />
          </div>
        </div>

        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={isImageModel ? "Image settings" : "Video settings"}
        >
          <MobileFieldRow label="Model">
            <ProviderModelPicker models={models} value={model} onChange={onModelChange} />
          </MobileFieldRow>

          {isImageModel && (
            <MobileFieldRow label="Style" description="Added to your prompt when you generate.">
              <PillSelect
                icon={Palette}
                label="Style"
                value={style}
                options={STYLE_OPTIONS}
                onChange={setStyle}
              />
            </MobileFieldRow>
          )}

          {isImageModel && (
            <MobileFieldRow label="Style" description="Added to your prompt when you generate.">
              <PillSelect
                icon={Palette}
                label="Style"
                value={style}
                options={STYLE_OPTIONS}
                onChange={setStyle}
              />
            </MobileFieldRow>
          )}

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
                  value={Math.min(
                    typeof duration === "number" ? duration : (field.defaultValue as number) ?? field.min!,
                    durationCap,
                  )}
                  min={field.min!}
                  max={durationCap}
                  formatValue={(v) => `${v}s`}
                  onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                  helperText={
                    durationCapped
                      ? upgradeHint(minTierForDuration(durationModelMax), `up to ${durationModelMax}s`)
                      : undefined
                  }
                />
              </MobileFieldRow>
            ) : (
              <MobileFieldRow key={field.key} label={field.label}>
                <PillSelect
                  icon={SELECT_FIELD_ICONS[field.key] ?? SlidersHorizontal}
                  label={field.label}
                  label={field.label}
                  value={(watch(field.key) as string) ?? field.options?.[0] ?? ""}
                  options={field.options ?? []}
                  renderHint={valueHint}
                  renderHint={valueHint}
                  onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                  isOptionLocked={optionLock(field.key)}
                  lockedHint={optionLockHint(field.key)}
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

          {isImageModel && (
            <PillSelect
              icon={Palette}
              label="Style"
              value={style}
              options={STYLE_OPTIONS}
              onChange={setStyle}
            />
          )}

          {isImageModel && (
            <PillSelect
              icon={Palette}
              label="Style"
              value={style}
              options={STYLE_OPTIONS}
              onChange={setStyle}
            />
          )}

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
                value={Math.min(
                  typeof duration === "number" ? duration : (field.defaultValue as number) ?? field.min!,
                  durationCap,
                )}
                min={field.min!}
                max={durationCap}
                formatValue={(v) => `${v}s`}
                onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                helperText={
                  durationCapped
                    ? upgradeHint(minTierForDuration(durationModelMax), `up to ${durationModelMax}s`)
                    : undefined
                }
              />
            ) : (
              <PillSelect
                key={field.key}
                icon={SELECT_FIELD_ICONS[field.key] ?? SlidersHorizontal}
                label={field.label}
                label={field.label}
                value={(watch(field.key) as string) ?? field.options?.[0] ?? ""}
                options={field.options ?? []}
                renderHint={valueHint}
                renderHint={valueHint}
                onChange={(v) => setValue(field.key, v, { shouldValidate: true })}
                isOptionLocked={optionLock(field.key)}
                lockedHint={optionLockHint(field.key)}
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
            balance={creditBalance}
            blockedReason={blockedReason}
          />
        </div>
      </ComposerShell>
    </form>
  );
}
