"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits, useUsage } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, FileType, Monitor, RectangleHorizontal } from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
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
  PanelSection,
  SegmentedTabs,
  PanelPromptField,
  PanelFieldList,
  PanelDropzone,
  ProviderModelPicker,
  PillSelect,
  FieldRow,
  CreditsSubmitPill,
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
      watermark: false,
      useVirtualAvatar: false,
      outputFormat: "mp4",
    },
  });

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
    // Fills the studio panel: fields scroll in the middle, Generate stays
    // pinned in the footer — see generate-workspace.tsx for the panel frame.
    <form onSubmit={submit} noValidate className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <PanelSection label="Model">
          <ProviderModelPicker models={models} value={model} onChange={onModelChange} fullWidth />
        </PanelSection>

        <PanelSection
          label="Upload an image"
          action={
            <SegmentedTabs
              value={refMode}
              options={["reference", "keyframe"] as const}
              onChange={handleModeChange}
              renderLabel={(m) => (m === "reference" ? "Reference" : "Keyframe")}
            />
          }
          hint={
            refMode === "keyframe"
              ? "First and last frame — the video interpolates between them."
              : "Optional — JPG, PNG or WEBP. Guides the whole generation."
          }
        >
          {refMode === "keyframe" ? (
            <div className="flex items-center gap-1.5">
              <PanelDropzone
                compact
                className="flex-1"
                label="First frame"
                previewUrl={preview}
                uploading={uploading}
                onFile={handleFile}
                onRemove={() => {
                  setPreview(null);
                  setValue("image", undefined, { shouldValidate: true });
                  // An end frame without a start frame isn't a valid pairing.
                  setEndFramePreview(null);
                  setValue("lastFrameImage", undefined, { shouldValidate: true });
                }}
              />
              <button
                type="button"
                onClick={handleSwapFrames}
                aria-label="Swap first and last frame"
                title="Swap first and last frame"
                className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-3 text-muted shadow-raised transition-all duration-200 hover:rotate-180 hover:border-border-strong hover:text-ink-soft"
              >
                <ArrowLeftRight className="size-3" aria-hidden="true" />
              </button>
              <PanelDropzone
                compact
                className="flex-1"
                label="Last frame"
                previewUrl={endFramePreview}
                uploading={uploadingEndFrame}
                onFile={handleEndFrameFile}
                onRemove={() => {
                  setEndFramePreview(null);
                  setValue("lastFrameImage", undefined, { shouldValidate: true });
                }}
                disabled={!image}
                disabledHint="Add a first frame first."
              />
            </div>
          ) : (
            <PanelDropzone
              label="Click or drag to upload"
              sublabel="JPG, PNG or WEBP"
              previewUrl={preview}
              uploading={uploading}
              onFile={handleFile}
              onRemove={() => {
                setPreview(null);
                setValue("image", undefined, { shouldValidate: true });
                setEndFramePreview(null);
                setValue("lastFrameImage", undefined, { shouldValidate: true });
              }}
            />
          )}
        </PanelSection>

        <PanelSection label="Prompt">
          <Controller
            control={control}
            name="prompt"
            render={({ field }) => (
              <PanelPromptField
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
        </PanelSection>

        <PanelSection label="Settings">
          <PanelFieldList>
            {/* Duration gets a full block rather than a FieldRow — the
                slider needs the row's whole width, and the Auto toggle
                belongs beside the label it modifies. */}
            <div className="border-b border-line py-3.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-label text-ink-soft">Duration</p>
                <div className="flex items-center gap-2">
                  <span className="text-caption text-muted">Auto (~8s)</span>
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
                </div>
              </div>
              <div className="mt-3">
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
            </div>

            <FieldRow label="Resolution">
              <PillSelect
                icon={Monitor}
                value={resolution}
                options={SEEDANCE_RESOLUTIONS}
                onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
                isOptionLocked={(r) => isResolutionLocked(r, tierInfo)}
                lockedHint={(r) => upgradeHint(minTierForResolution(r), r)}
              />
            </FieldRow>

            <FieldRow label="Aspect ratio">
              <PillSelect
                icon={RectangleHorizontal}
                value={aspectRatio}
                options={SEEDANCE_ASPECT_RATIOS}
                renderLabel={(a) => (a === "adaptive" ? "Adaptive" : a)}
                onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
              />
            </FieldRow>

            <FieldRow label="Format">
              <PillSelect
                icon={FileType}
                value={outputFormat}
                options={SEEDANCE_OUTPUT_FORMATS}
                renderLabel={(f) => f.toUpperCase()}
                onChange={(f) => setValue("outputFormat", f, { shouldValidate: true })}
              />
            </FieldRow>

            <FieldRow label="Generate audio" description="Sync ambient sound / dialogue to the video.">
              <Controller
                control={control}
                name="generateAudio"
                render={({ field }) => <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />}
              />
            </FieldRow>

            <FieldRow
              label="Virtual avatar mode"
              description="For AI-generated character references — routes around face/deepfake detection via ByteDance's trusted avatar library."
            >
              <Controller
                control={control}
                name="useVirtualAvatar"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </FieldRow>

            <div className="py-3.5">
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
          </PanelFieldList>
        </PanelSection>
      </div>

      <div className="shrink-0 border-t border-line p-4 sm:p-5">
        <CreditsSubmitPill
          fullWidth
          credits={estimatedCredits}
          loading={mutation.isPending || busy || uploading}
          balance={creditBalance}
          blockedReason={blockedReason}
        />
      </div>
    </form>
  );
}
