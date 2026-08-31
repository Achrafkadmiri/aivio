"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits, useUsage } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, ChevronDown, FileType, Monitor, RectangleHorizontal, ScanFace } from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { DropdownRoot, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import { cn } from "@/lib/utils";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { seedanceVideoSchema, type SeedanceVideoInput } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import {
  isResolutionLocked,
  isDurationLocked,
  bestAllowedResolution,
  minTierForResolution,
  minTierForDuration,
  upgradeHint,
} from "@/lib/tier-limits";
import {
  SEEDANCE_MODEL_ID,
  SEEDANCE_DURATION_MIN,
  SEEDANCE_DURATION_MAX,
  SEEDANCE_DURATION_AUTO,
  SEEDANCE_RESOLUTIONS,
  SEEDANCE_ASPECT_RATIOS,
  SEEDANCE_OUTPUT_FORMATS,
  type VideoModelId,
  type TierInfo,
} from "@/lib/constants";
import {
  ComposerShell,
  KeyframeReferenceControl,
  ComposerPromptField,
  ProviderModelPicker,
  PillSelect,
  SettingsPopover,
  SettingRow,
  MobileOptionsTrigger,
  MobileFieldRow,
  CreditsSubmitPill,
  pillClass,
  type PickerModel,
  type ReferenceMode,
} from "./composer";

export function SeedanceVideoForm({
  models,
  model,
  onModelChange,
  initialPrompt,
  onPromptChange,
  onCreated,
  busy,
  tierInfo,
}: {
  models: readonly PickerModel<VideoModelId>[];
  model: VideoModelId;
  onModelChange: (id: VideoModelId) => void;
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onCreated: (jobId: string) => void;
  busy: boolean;
  /** Current plan's limits — undefined while still loading. Gates
   * resolution and duration controls client-side so a locked pick is
   * resolution and duration controls client-side so a locked pick is
   * discoverable before hitting the server's 403 (see aiVideo-backend's
   * generations.ts, the actual source of truth for these limits). */
  tierInfo?: TierInfo;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  // Cache read on the same ["usage"] key the workspace already fetched.
  const creditBalance = useUsage().data?.credit_balance;
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingEndFrame, setUploadingEndFrame] = useState(false);
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refMode, setRefMode] = useState<ReferenceMode>("reference");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SeedanceVideoInput>({
    resolver: zodResolver(seedanceVideoSchema) as Resolver<SeedanceVideoInput>,
    defaultValues: {
      prompt: initialPrompt,
      duration: 5,
      resolution: "720p",
      aspectRatio: "adaptive",
      generateAudio: true,
      generateAudio: true,
      watermark: false,
      useVirtualAvatar: false,
      outputFormat: "mp4",
    },
  });

  const prompt = watch("prompt") ?? "";
  const duration = watch("duration");
  const resolution = watch("resolution");
  const aspectRatio = watch("aspectRatio");
  const outputFormat = watch("outputFormat");
  const image = watch("image");
  const isAuto = duration === SEEDANCE_DURATION_AUTO;
  const estimatedCredits = estimateVideoCredits(SEEDANCE_MODEL_ID, duration, resolution);

  // "Auto" duration lands around ~8s (see LIVE_VIDEO_AUTO_DURATION_ESTIMATE
  // in credit-estimate.ts) — locked on plans capped below that.
  const autoLocked = isDurationLocked(8, tierInfo);
  const durationCap = tierInfo ? Math.min(SEEDANCE_DURATION_MAX, tierInfo.maxDurationSeconds) : SEEDANCE_DURATION_MAX;
  const durationCapped = durationCap < SEEDANCE_DURATION_MAX;

  // The form defaults to 720p, which the free plan (480p) cannot submit — so
  // it used to open showing a locked value as the current pick and only said
  // so via a 403 after pressing Generate. tierInfo lands async, after
  // react-hook-form has taken its defaults, so this corrects it here.
  useEffect(() => {
    if (!tierInfo || !isResolutionLocked(resolution, tierInfo)) return;
    const allowed = bestAllowedResolution(SEEDANCE_RESOLUTIONS, tierInfo);
    if (allowed) setValue("resolution", allowed as typeof resolution, { shouldValidate: true });
  }, [tierInfo, resolution, setValue]);

  // Every Seedance 2.5 resolution is reachable on some plan, so a pick still
  // locked here means the clamp above had nothing to fall back to.
  const blockedReason = isResolutionLocked(resolution, tierInfo)
    ? upgradeHint(minTierForResolution(resolution), resolution)
    : undefined;

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

  async function handleEndFrameFile(file: File) {
    setUploadingEndFrame(true);
    setEndFramePreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setValue("lastFrameImage", json.url, { shouldValidate: true });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
      setEndFramePreview(null);
    } finally {
      setUploadingEndFrame(false);
    }
  }

  function handleModeChange(next: ReferenceMode) {
    setRefMode(next);
    // The two modes are mutually exclusive — leaving "Keyframe" drops
    // whatever end frame was set, since a last frame with no mode that
    // supports it is not a valid pairing.
    if (next !== "keyframe") {
      setEndFramePreview(null);
      setValue("lastFrameImage", undefined, { shouldValidate: true });
    }
  }

  function handleSwapFrames() {
    const nextImage = watch("lastFrameImage");
    const nextLastFrame = watch("image");
    setValue("image", nextImage, { shouldValidate: true });
    setValue("lastFrameImage", nextLastFrame, { shouldValidate: true });
    const nextPreview = endFramePreview;
    setEndFramePreview(preview);
    setPreview(nextPreview);
  }

  const mutation = useMutation({
    mutationFn: async (data: SeedanceVideoInput) => {
      const res = await apiFetch("/api/generations/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, model: SEEDANCE_MODEL_ID }),
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

  return (
    <form onSubmit={submit} noValidate>
      <ComposerShell>
        {/* Stacked on mobile — the reference-upload tiles and the prompt
            field sharing one row squeezes the textarea down to almost no
            width, wrapping short placeholder text onto 3-4 lines. Desktop
            keeps them side by side. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="shrink-0 space-y-2.5">
            <KeyframeReferenceControl
              mode={refMode}
              onModeChange={handleModeChange}
              first={{
                previewUrl: preview,
                uploading,
                onFile: handleFile,
                onRemove: () => {
                  setPreview(null);
                  setValue("image", undefined, { shouldValidate: true });
                  // An end frame without a start frame isn't a valid pairing.
                  setEndFramePreview(null);
                  setValue("lastFrameImage", undefined, { shouldValidate: true });
                },
              }}
              last={{
                previewUrl: endFramePreview,
                uploading: uploadingEndFrame,
                onFile: handleEndFrameFile,
                onRemove: () => {
                  setEndFramePreview(null);
                  setValue("lastFrameImage", undefined, { shouldValidate: true });
                },
              }}
              lastDisabled={!image}
              onSwap={handleSwapFrames}
            />
          </div>

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="min-w-0 flex-1">
              <Controller
                control={control}
                name="prompt"
                render={({ field }) => (
                  <ComposerPromptField
                    value={field.value ?? ""}
                    onChange={(v) => {
                      field.onChange(v);
                      onPromptChange(v);
                    }}
                    onSubmit={submit}
                    placeholder="Describe the scene you imagine"
                    maxLength={2000}
                  />
                )}
              />
              <FieldError>{errors.prompt?.message}</FieldError>
            </div>

            <span className="mt-3 shrink-0 text-caption text-muted">{prompt.length}/2000</span>
          </div>
        </div>

        {/* Mobile: modality switcher + a single "Options" trigger that opens
            a full BottomSheet with everything else, including the model
            picker (see the sheet below) — 7+ controls never comfortably fit
            on a phone screen, scrolling or not, and collapsing them into one
            native-style drawer (inspired by Artlist's mobile composer) reads
            far better than a horizontally-scrolling toolbar. */}
        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <ModalitySwitcherMobile type="text-to-video" />
          <MobileOptionsTrigger onClick={() => setSheetOpen(true)} />
          <div className="ml-auto">
            <CreditsSubmitPill
              credits={estimatedCredits}
              loading={mutation.isPending || busy || uploading}
              balance={creditBalance}
              blockedReason={blockedReason}
            />
          </div>
        </div>

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Video settings">
          <MobileFieldRow label="Model">
            <ProviderModelPicker models={models} value={model} onChange={onModelChange} />
          </MobileFieldRow>
          <MobileFieldRow label="Duration">
            <DropdownRoot>
              <DropdownTrigger asChild>
                <button type="button" className={pillClass}>
                  <Clock className="size-3.5 text-muted" aria-hidden="true" />
                  <span className="font-medium">{isAuto ? "Auto" : `${duration}s`}</span>
                  <ChevronDown className="size-3 text-muted" aria-hidden="true" />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" className="w-64 space-y-3 p-4">
                <SettingRow title="Automatic duration" description="Let the model pick a natural length (~8s).">
                  {autoLocked ? (
                    <Tooltip content={upgradeHint(minTierForDuration(8), "automatic duration")}>
                      <span className="inline-flex" tabIndex={0}>
                        <Switch checked={false} disabled />
                      </span>
                    </Tooltip>
                  ) : (
                    <Switch
                      checked={isAuto}
                      onCheckedChange={(checked) =>
                        setValue("duration", checked ? SEEDANCE_DURATION_AUTO : 5, { shouldValidate: true })
                      }
                    />
                  )}
                </SettingRow>
                <div>
                  <div className="mb-2 flex items-center justify-between text-caption text-muted">
                    <span>{SEEDANCE_DURATION_MIN}s</span>
                    <span className={cn("text-label text-ink-soft", isAuto && "opacity-40")}>
                      {isAuto ? "—" : `${duration}s`}
                    </span>
                    <span>{durationCap}s</span>
                  </div>
                  <Slider
                    min={SEEDANCE_DURATION_MIN}
                    max={durationCap}
                    step={1}
                    disabled={isAuto}
                    value={[isAuto ? SEEDANCE_DURATION_MIN : Math.min(duration, durationCap)]}
                    onValueChange={([v]) => setValue("duration", v, { shouldValidate: true })}
                  />
                  {durationCapped && (
                    <p className="mt-1.5 text-caption text-muted">
                      {upgradeHint(minTierForDuration(SEEDANCE_DURATION_MAX), `up to ${SEEDANCE_DURATION_MAX}s`)}
                    </p>
                  )}
                </div>
                <FieldError>{errors.duration?.message}</FieldError>
              </DropdownContent>
            </DropdownRoot>
          </MobileFieldRow>
          <MobileFieldRow label="Resolution">
            <PillSelect
              icon={Monitor}
              value={resolution}
              options={SEEDANCE_RESOLUTIONS}
              onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
              isOptionLocked={(r) => isResolutionLocked(r, tierInfo)}
              lockedHint={(r) => upgradeHint(minTierForResolution(r), r)}
            />
          </MobileFieldRow>
          <MobileFieldRow label="Aspect ratio">
            <PillSelect
              icon={RectangleHorizontal}
              value={aspectRatio}
              options={SEEDANCE_ASPECT_RATIOS}
              renderLabel={(a) => (a === "adaptive" ? "Adaptive" : a)}
              onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
            />
          </MobileFieldRow>
          <MobileFieldRow label="Format">
            <PillSelect
              icon={FileType}
              value={outputFormat}
              options={SEEDANCE_OUTPUT_FORMATS}
              renderLabel={(f) => f.toUpperCase()}
              onChange={(f) => setValue("outputFormat", f, { shouldValidate: true })}
            />
          </MobileFieldRow>
          <MobileFieldRow label="Generate audio" description="Sync ambient sound / dialogue to the video.">
            <Controller
              control={control}
              name="generateAudio"
              render={({ field }) => <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />}
              render={({ field }) => <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />}
            />
          </MobileFieldRow>
          <MobileFieldRow
            label="Virtual avatar mode"
            description="For AI-generated character references — routes around face/deepfake detection via ByteDance's trusted avatar library."
          >
            <Controller
              control={control}
              name="useVirtualAvatar"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </MobileFieldRow>
          <div className="py-3.5">
            <label htmlFor="sd-seed-mobile" className="mb-1.5 block text-label text-ink-soft">
              Seed (optional)
            </label>
            <Input
              id="sd-seed-mobile"
              type="number"
              placeholder="Random"
              {...register("seed", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </div>
        </BottomSheet>

        {/* Desktop: full pill row, scrolling horizontally instead of
            wrapping onto more rows if it ever runs out of room. */}
        <div className="mt-3 hidden items-center gap-2 sm:flex">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <ProviderModelPicker models={models} value={model} onChange={onModelChange} />

          <Tooltip content="Coming soon — character consistency isn't wired up yet.">
            <span className="inline-flex" tabIndex={0}>
              <button type="button" disabled className={pillClass}>
                <ScanFace className="size-3.5 text-muted" aria-hidden="true" />
                Characters
              </button>
            </span>
          </Tooltip>

          <DropdownRoot>
            <DropdownTrigger asChild>
              <button type="button" className={pillClass}>
                <Clock className="size-3.5 text-muted" aria-hidden="true" />
                <span className="font-medium">{isAuto ? "Auto" : `${duration}s`}</span>
                <ChevronDown className="size-3 text-muted" aria-hidden="true" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="start" className="w-64 space-y-3 p-4">
              <SettingRow title="Automatic duration" description="Let the model pick a natural length (~8s).">
                {autoLocked ? (
                  <Tooltip content={upgradeHint(minTierForDuration(8), "automatic duration")}>
                    <span className="inline-flex" tabIndex={0}>
                      <Switch checked={false} disabled />
                    </span>
                  </Tooltip>
                ) : (
                  <Switch
                    checked={isAuto}
                    onCheckedChange={(checked) =>
                      setValue("duration", checked ? SEEDANCE_DURATION_AUTO : 5, { shouldValidate: true })
                    }
                  />
                )}
              </SettingRow>
              <div>
                <div className="mb-2 flex items-center justify-between text-caption text-muted">
                  <span>{SEEDANCE_DURATION_MIN}s</span>
                  <span className={cn("text-label text-ink-soft", isAuto && "opacity-40")}>
                    {isAuto ? "—" : `${duration}s`}
                  </span>
                  <span>{durationCap}s</span>
                </div>
                <Slider
                  min={SEEDANCE_DURATION_MIN}
                  max={durationCap}
                  step={1}
                  disabled={isAuto}
                  value={[isAuto ? SEEDANCE_DURATION_MIN : Math.min(duration, durationCap)]}
                  onValueChange={([v]) => setValue("duration", v, { shouldValidate: true })}
                />
                {durationCapped && (
                  <p className="mt-1.5 text-caption text-muted">
                    {upgradeHint(minTierForDuration(SEEDANCE_DURATION_MAX), `up to ${SEEDANCE_DURATION_MAX}s`)}
                  </p>
                )}
              </div>
              <FieldError>{errors.duration?.message}</FieldError>
            </DropdownContent>
          </DropdownRoot>

          <PillSelect
            icon={Monitor}
            value={resolution}
            options={SEEDANCE_RESOLUTIONS}
            onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
            isOptionLocked={(r) => isResolutionLocked(r, tierInfo)}
            lockedHint={(r) => upgradeHint(minTierForResolution(r), r)}
          />

          <PillSelect
            icon={RectangleHorizontal}
            value={aspectRatio}
            options={SEEDANCE_ASPECT_RATIOS}
            renderLabel={(a) => (a === "adaptive" ? "Adaptive" : a)}
            onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
          />

          <PillSelect
            icon={FileType}
            value={outputFormat}
            options={SEEDANCE_OUTPUT_FORMATS}
            renderLabel={(f) => f.toUpperCase()}
            onChange={(f) => setValue("outputFormat", f, { shouldValidate: true })}
          />

          <SettingsPopover>
            <SettingRow title="Generate audio" description="Sync ambient sound / dialogue to the video.">
              <Controller
                control={control}
                name="generateAudio"
                render={({ field }) => (
                  <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                )}
              />
            </SettingRow>
            <SettingRow
              title="Virtual avatar mode"
              description="For AI-generated character references — routes around face/deepfake detection via ByteDance's trusted avatar library."
            >
              <Controller
                control={control}
                name="useVirtualAvatar"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </SettingRow>
            <div>
              <label htmlFor="sd-seed" className="mb-1.5 block text-label text-ink-soft">
                Seed (optional)
              </label>
              <Input
                id="sd-seed"
                type="number"
                placeholder="Random"
                {...register("seed", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </div>
          </SettingsPopover>
        </div>

          <CreditsSubmitPill
              credits={estimatedCredits}
              loading={mutation.isPending || busy || uploading}
              balance={creditBalance}
              blockedReason={blockedReason}
            />
        </div>
      </ComposerShell>
    </form>
  );
}
