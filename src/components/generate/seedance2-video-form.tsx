"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Monitor, RectangleHorizontal, ScanFace, Zap } from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { seedance2VideoSchema, type Seedance2VideoInput } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import {
  isResolutionLocked,
  isDurationLocked,
  minTierForResolution,
  minTierForDuration,
  upgradeHint,
} from "@/lib/tier-limits";
import {
  SEEDANCE2_MODEL_ID,
  SEEDANCE2_DURATION_MIN,
  SEEDANCE2_DURATION_MAX,
  SEEDANCE2_RESOLUTIONS,
  SEEDANCE2_ASPECT_RATIOS,
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

const DURATIONS = Array.from(
  { length: SEEDANCE2_DURATION_MAX - SEEDANCE2_DURATION_MIN + 1 },
  (_, i) => SEEDANCE2_DURATION_MIN + i,
);

function clampDuration(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isInteger(value)) return undefined;
  return Math.min(SEEDANCE2_DURATION_MAX, Math.max(SEEDANCE2_DURATION_MIN, value));
}

export function Seedance2VideoForm({
  models,
  model,
  onModelChange,
  initialPrompt,
  onPromptChange,
  initialParams,
  onCreated,
  busy,
  tierInfo,
}: {
  models: readonly PickerModel<VideoModelId>[];
  model: VideoModelId;
  onModelChange: (id: VideoModelId) => void;
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  /** Deep-link support (e.g. "Use this template" from the prompt gallery). */
  initialParams?: {
    duration?: number;
    resolution?: (typeof SEEDANCE2_RESOLUTIONS)[number];
    aspectRatio?: (typeof SEEDANCE2_ASPECT_RATIOS)[number];
  };
  onCreated: (jobId: string) => void;
  busy: boolean;
  /** Current plan's limits — undefined while still loading. See
   * seedance-video-form.tsx's tierInfo prop for the full rationale. */
  tierInfo?: TierInfo;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
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
  } = useForm<Seedance2VideoInput>({
    resolver: zodResolver(seedance2VideoSchema) as Resolver<Seedance2VideoInput>,
    defaultValues: {
      prompt: initialPrompt,
      duration: clampDuration(initialParams?.duration) ?? 5,
      resolution: initialParams?.resolution ?? "720p",
      aspectRatio: initialParams?.aspectRatio ?? "16:9",
      cameraFixed: false,
      generateAudio: true,
      watermark: false,
      useVirtualAvatar: false,
    },
  });

  const prompt = watch("prompt") ?? "";
  const duration = watch("duration");
  const resolution = watch("resolution");
  const aspectRatio = watch("aspectRatio");
  const image = watch("image");
  const hasReference = Boolean(image);
  const estimatedCredits = estimateVideoCredits(SEEDANCE2_MODEL_ID, duration, resolution);

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
    // A last frame without a mode that supports it isn't a valid pairing —
    // switching back to "Reference" drops whatever end frame was set.
    if (next === "reference") {
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
    mutationFn: async (data: Seedance2VideoInput) => {
      const res = await apiFetch("/api/generations/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, model: SEEDANCE2_MODEL_ID }),
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
    <form onSubmit={submit} className="space-y-2" noValidate>
      <p className="flex items-center gap-1.5 px-1 text-caption text-muted">
        <Zap className="size-3 text-success" aria-hidden="true" />
        Billed per generation.
      </p>

      <ComposerShell>
        {/* Stacked on mobile — see seedance-video-form.tsx for the full
            rationale. Desktop keeps them side by side. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="shrink-0">
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

        {/* Mobile: modality switcher + a single "Options" trigger opening a
            BottomSheet with everything else, including the model picker —
            see seedance-video-form.tsx for the full rationale. */}
        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <ModalitySwitcherMobile type="text-to-video" />
          <MobileOptionsTrigger onClick={() => setSheetOpen(true)} />
          <div className="ml-auto">
            <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy || uploading} />
          </div>
        </div>

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Video settings">
          <MobileFieldRow label="Model">
            <ProviderModelPicker models={models} value={model} onChange={onModelChange} />
          </MobileFieldRow>
          <MobileFieldRow label="Duration">
            <PillSelect
              icon={Clock}
              value={duration}
              options={DURATIONS}
              renderLabel={(d) => `${d}s`}
              onChange={(d) => setValue("duration", d, { shouldValidate: true })}
              isOptionLocked={(d) => isDurationLocked(d, tierInfo)}
              lockedHint={(d) => upgradeHint(minTierForDuration(d), `${d}s clips`)}
            />
          </MobileFieldRow>
          <MobileFieldRow label="Resolution">
            <PillSelect
              icon={Monitor}
              value={resolution}
              options={SEEDANCE2_RESOLUTIONS}
              renderLabel={(r) => (r === "4k" ? "4K" : r)}
              onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
              isOptionLocked={(r) => isResolutionLocked(r, tierInfo)}
              lockedHint={(r) => upgradeHint(minTierForResolution(r), r === "4k" ? "4K" : r)}
            />
          </MobileFieldRow>
          <MobileFieldRow
            label="Aspect ratio"
            description={hasReference ? "Ignored while a reference image is set." : undefined}
          >
            <PillSelect
              icon={RectangleHorizontal}
              value={aspectRatio}
              options={SEEDANCE2_ASPECT_RATIOS}
              onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
              disabled={hasReference}
              disabledHint="Ignored while a reference image is set — the video inherits its aspect ratio."
            />
          </MobileFieldRow>
          <MobileFieldRow label="Fix camera position" description="Lock the camera instead of letting it move.">
            <Controller
              control={control}
              name="cameraFixed"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </MobileFieldRow>
          <MobileFieldRow label="Generate audio" description="Sync ambient sound / dialogue to the video.">
            <Controller
              control={control}
              name="generateAudio"
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
            <label htmlFor="sd2-seed-mobile" className="mb-1.5 block text-label text-ink-soft">
              Seed (optional)
            </label>
            <Input
              id="sd2-seed-mobile"
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

          <PillSelect
            icon={Clock}
            value={duration}
            options={DURATIONS}
            renderLabel={(d) => `${d}s`}
            onChange={(d) => setValue("duration", d, { shouldValidate: true })}
            isOptionLocked={(d) => isDurationLocked(d, tierInfo)}
            lockedHint={(d) => upgradeHint(minTierForDuration(d), `${d}s clips`)}
          />

          <PillSelect
            icon={Monitor}
            value={resolution}
            options={SEEDANCE2_RESOLUTIONS}
            renderLabel={(r) => (r === "4k" ? "4K" : r)}
            onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
            isOptionLocked={(r) => isResolutionLocked(r, tierInfo)}
            lockedHint={(r) => upgradeHint(minTierForResolution(r), r === "4k" ? "4K" : r)}
          />

          <PillSelect
            icon={RectangleHorizontal}
            value={aspectRatio}
            options={SEEDANCE2_ASPECT_RATIOS}
            onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
            disabled={hasReference}
            disabledHint="Ignored while a reference image is set — the video inherits its aspect ratio."
          />

          <SettingsPopover>
            <SettingRow title="Fix camera position" description="Lock the camera instead of letting it move.">
              <Controller
                control={control}
                name="cameraFixed"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </SettingRow>
            <SettingRow title="Generate audio" description="Sync ambient sound / dialogue to the video.">
              <Controller
                control={control}
                name="generateAudio"
                render={({ field }) => (
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
              <label htmlFor="sd2-seed" className="mb-1.5 block text-label text-ink-soft">
                Seed (optional)
              </label>
              <Input
                id="sd2-seed"
                type="number"
                placeholder="Random"
                {...register("seed", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </div>
          </SettingsPopover>
        </div>

          <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy || uploading} />
        </div>
      </ComposerShell>
    </form>
  );
}
