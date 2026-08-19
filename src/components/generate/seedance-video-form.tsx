"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, ChevronDown, FileType, Monitor, RectangleHorizontal, ScanFace, Zap } from "lucide-react";
import { FieldError, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { DropdownRoot, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { seedanceVideoSchema, type SeedanceVideoInput } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import {
  SEEDANCE_MODEL_ID,
  SEEDANCE_DURATION_MIN,
  SEEDANCE_DURATION_MAX,
  SEEDANCE_DURATION_AUTO,
  SEEDANCE_RESOLUTIONS,
  SEEDANCE_ASPECT_RATIOS,
  SEEDANCE_OUTPUT_FORMATS,
  type VideoModelId,
} from "@/lib/constants";
import {
  ComposerShell,
  ReferenceUploadRow,
  ReferenceUploadTile,
  ComposerPromptField,
  ProviderModelPicker,
  PillSelect,
  SettingsPopover,
  SettingRow,
  CreditsSubmitPill,
  pillClass,
  type PickerModel,
} from "./composer";

export function SeedanceVideoForm({
  models,
  model,
  onModelChange,
  initialPrompt,
  onPromptChange,
  onCreated,
  busy,
}: {
  models: readonly PickerModel<VideoModelId>[];
  model: VideoModelId;
  onModelChange: (id: VideoModelId) => void;
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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
  const referenceVideoUrl = watch("referenceVideoUrl");
  const isAuto = duration === SEEDANCE_DURATION_AUTO;
  const estimatedCredits = estimateVideoCredits(SEEDANCE_MODEL_ID, duration, resolution, {
    hasReferenceVideo: Boolean(referenceVideoUrl),
  });

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

  async function handleVideoFile(file: File) {
    setUploadingVideo(true);
    setVideoPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setValue("referenceVideoUrl", json.url, { shouldValidate: true });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
      setVideoPreview(null);
    } finally {
      setUploadingVideo(false);
    }
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
      queryClient.invalidateQueries({ queryKey: ["usage"] });
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
        {resolution === "1080p" || referenceVideoUrl
          ? "Billed on your kie.ai account per generation."
          : "Billed on your Cloudflare account per generation."}
      </p>

      <ComposerShell>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <ReferenceUploadRow>
              <ReferenceUploadTile
                kind="image"
                label="Reference Images"
                previewUrl={preview}
                uploading={uploading}
                onFile={handleFile}
                onRemove={() => {
                  setPreview(null);
                  setValue("image", undefined, { shouldValidate: true });
                }}
              />
              <ReferenceUploadTile
                kind="video"
                label="Reference Video"
                previewUrl={videoPreview}
                uploading={uploadingVideo}
                onFile={handleVideoFile}
                onRemove={() => {
                  setVideoPreview(null);
                  setValue("referenceVideoUrl", undefined, { shouldValidate: true });
                }}
              />
              <ReferenceUploadTile
                kind="audio"
                label="Reference Audio"
                disabled
                disabledHint="Coming soon — not yet supported by this model's integration."
              />
            </ReferenceUploadRow>
          </div>

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

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
                <Switch
                  checked={isAuto}
                  onCheckedChange={(checked) =>
                    setValue("duration", checked ? SEEDANCE_DURATION_AUTO : 5, { shouldValidate: true })
                  }
                />
              </SettingRow>
              <div>
                <div className="mb-2 flex items-center justify-between text-caption text-muted">
                  <span>{SEEDANCE_DURATION_MIN}s</span>
                  <span className={cn("text-label text-ink-soft", isAuto && "opacity-40")}>
                    {isAuto ? "—" : `${duration}s`}
                  </span>
                  <span>{SEEDANCE_DURATION_MAX}s</span>
                </div>
                <Slider
                  min={SEEDANCE_DURATION_MIN}
                  max={SEEDANCE_DURATION_MAX}
                  step={1}
                  disabled={isAuto}
                  value={[isAuto ? SEEDANCE_DURATION_MIN : duration]}
                  onValueChange={([v]) => setValue("duration", v, { shouldValidate: true })}
                />
              </div>
              <FieldError>{errors.duration?.message}</FieldError>
            </DropdownContent>
          </DropdownRoot>

          <PillSelect
            icon={Monitor}
            value={resolution}
            options={SEEDANCE_RESOLUTIONS}
            onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
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
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                )}
              />
            </SettingRow>
            <SettingRow title="Watermark" description="Add a visible watermark to the output.">
              <Controller
                control={control}
                name="watermark"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
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

          <div className="ml-auto">
            <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy || uploading} />
          </div>
        </div>
      </ComposerShell>
    </form>
  );
}
