"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Monitor, MoveHorizontal, ScanFace, Wind } from "lucide-react";
import { FieldError } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { imageToVideoSchema, type ImageToVideoInput } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import {
  VIDEO_DURATIONS,
  VIDEO_RESOLUTIONS,
  MOTION_INTENSITIES,
  CAMERA_MOVEMENTS,
  type VideoModelId,
} from "@/lib/constants";
import {
  ComposerShell,
  ReferenceUploadRow,
  ReferenceUploadTile,
  ComposerPromptField,
  ProviderModelPicker,
  PillSelect,
  MobileOptionsTrigger,
  MobileFieldRow,
  CreditsSubmitPill,
  pillClass,
  type PickerModel,
} from "./composer";

export function GenericImageToVideoForm({
  models,
  model,
  onModelChange,
  onCreated,
  busy,
}: {
  models: readonly PickerModel<VideoModelId>[];
  model: VideoModelId;
  onModelChange: (id: VideoModelId) => void;
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImageToVideoInput>({
    resolver: zodResolver(imageToVideoSchema) as Resolver<ImageToVideoInput>,
    defaultValues: {
      model,
      duration: 5,
      resolution: "720p",
      motionIntensity: "medium",
      cameraMovement: "subtle",
      imageUrl: "",
      prompt: "",
    },
  });

  const imageUrl = watch("imageUrl");
  const prompt = watch("prompt") ?? "";
  const duration = watch("duration");
  const resolution = watch("resolution");
  const motionIntensity = watch("motionIntensity");
  const cameraMovement = watch("cameraMovement");
  const estimatedCredits = estimateVideoCredits(model, duration, resolution);

  async function handleFile(file: File) {
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setValue("imageUrl", json.url, { shouldValidate: true });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: ImageToVideoInput) => {
      const res = await apiFetch("/api/generations/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, model }),
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
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <ReferenceUploadRow>
              <ReferenceUploadTile
                kind="image"
                label="Source Image"
                optional={false}
                previewUrl={preview}
                uploading={uploading}
                onFile={handleFile}
                onRemove={() => {
                  setPreview(null);
                  setValue("imageUrl", "", { shouldValidate: true });
                }}
              />
              <ReferenceUploadTile
                kind="video"
                label="Reference Video"
                disabled
                disabledHint="Coming soon — not yet supported by this model's integration."
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
                  onChange={field.onChange}
                  onSubmit={submit}
                  placeholder="Describe the motion — slow push in, gentle breeze through hair…"
                  maxLength={500}
                />
              )}
            />
            <FieldError>{!imageUrl ? errors.imageUrl?.message : undefined}</FieldError>
          </div>

          <span className="mt-3 shrink-0 text-caption text-muted">{prompt.length}/500</span>
        </div>

        {/* Mobile: modality switcher + a single "Options" trigger that opens
            a BottomSheet with every field, including the model picker — see
            seedance-video-form.tsx for the full rationale. */}
        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <ModalitySwitcherMobile type="image-to-video" />
          <MobileOptionsTrigger onClick={() => setSheetOpen(true)} />
          <div className="ml-auto">
            <CreditsSubmitPill
              credits={estimatedCredits}
              loading={mutation.isPending || busy || uploading}
              disabled={!imageUrl}
            />
          </div>
        </div>

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Video settings">
          <MobileFieldRow label="Model">
            <ProviderModelPicker models={models} value={model} onChange={onModelChange} />
          </MobileFieldRow>

          <MobileFieldRow label="Characters" description="Coming soon — character consistency isn't wired up yet.">
            <ScanFace className="size-4 text-muted" aria-hidden="true" />
          </MobileFieldRow>

          <MobileFieldRow label="Duration">
            <PillSelect
              icon={Clock}
              value={duration}
              options={VIDEO_DURATIONS}
              renderLabel={(d) => `${d}s`}
              onChange={(d) => setValue("duration", d, { shouldValidate: true })}
            />
          </MobileFieldRow>

          <MobileFieldRow label="Resolution">
            <PillSelect
              icon={Monitor}
              value={resolution}
              options={VIDEO_RESOLUTIONS}
              onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
            />
          </MobileFieldRow>

          <MobileFieldRow label="Motion">
            <PillSelect
              icon={Wind}
              value={motionIntensity}
              options={MOTION_INTENSITIES}
              renderLabel={(m) => `${m[0].toUpperCase()}${m.slice(1)} motion`}
              onChange={(m) => setValue("motionIntensity", m, { shouldValidate: true })}
            />
          </MobileFieldRow>

          <MobileFieldRow label="Camera">
            <PillSelect
              icon={MoveHorizontal}
              value={cameraMovement}
              options={CAMERA_MOVEMENTS}
              renderLabel={(c) => `${c[0].toUpperCase()}${c.slice(1)} camera`}
              onChange={(c) => setValue("cameraMovement", c, { shouldValidate: true })}
            />
          </MobileFieldRow>
        </BottomSheet>

        {/* Desktop: full pill row, scrolling horizontally instead of
            wrapping. Submit stays a sibling of the scroll area so it's
            always visible. */}
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
            options={VIDEO_DURATIONS}
            renderLabel={(d) => `${d}s`}
            onChange={(d) => setValue("duration", d, { shouldValidate: true })}
          />

          <PillSelect
            icon={Monitor}
            value={resolution}
            options={VIDEO_RESOLUTIONS}
            onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
          />

          <PillSelect
            icon={Wind}
            value={motionIntensity}
            options={MOTION_INTENSITIES}
            renderLabel={(m) => `${m[0].toUpperCase()}${m.slice(1)} motion`}
            onChange={(m) => setValue("motionIntensity", m, { shouldValidate: true })}
          />

          <PillSelect
            icon={MoveHorizontal}
            value={cameraMovement}
            options={CAMERA_MOVEMENTS}
            renderLabel={(c) => `${c[0].toUpperCase()}${c.slice(1)} camera`}
            onChange={(c) => setValue("cameraMovement", c, { shouldValidate: true })}
          />
        </div>

          <CreditsSubmitPill
            credits={estimatedCredits}
            loading={mutation.isPending || busy || uploading}
            disabled={!imageUrl}
          />
        </div>
      </ComposerShell>
    </form>
  );
}
