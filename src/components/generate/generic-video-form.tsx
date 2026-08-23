"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Monitor, RectangleHorizontal, ScanFace, Timer } from "lucide-react";
import { FieldError } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { textToVideoSchema, type TextToVideoInput } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalitySwitcherMobile } from "./modality-switcher";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { apiFetch } from "@/lib/api-client";
import {
  VIDEO_DURATIONS,
  VIDEO_RESOLUTIONS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_FPS,
  type VideoModelId,
} from "@/lib/constants";
import {
  ComposerShell,
  ComposerPromptField,
  ProviderModelPicker,
  PillSelect,
  MobileOptionsTrigger,
  MobileFieldRow,
  CreditsSubmitPill,
  pillClass,
  type PickerModel,
} from "./composer";

export function GenericVideoForm({
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
  const invalidateCredits = useInvalidateCredits();
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextToVideoInput>({
    resolver: zodResolver(textToVideoSchema) as Resolver<TextToVideoInput>,
    defaultValues: {
      model,
      prompt: initialPrompt,
      duration: 5,
      resolution: "720p",
      aspectRatio: "16:9",
      fps: 24,
    },
  });

  const prompt = watch("prompt") ?? "";
  const duration = watch("duration");
  const resolution = watch("resolution");
  const aspectRatio = watch("aspectRatio");
  const fps = watch("fps");
  const estimatedCredits = estimateVideoCredits(model, duration, resolution);

  const mutation = useMutation({
    mutationFn: async (data: TextToVideoInput) => {
      const res = await apiFetch("/api/generations/text-to-video", {
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
                  maxLength={1000}
                />
              )}
            />
            <FieldError>{errors.prompt?.message}</FieldError>
          </div>
          <span className="mt-3 shrink-0 text-caption text-muted">{prompt.length}/1000</span>
        </div>

        {/* Mobile: modality switcher + a single "Options" trigger that opens
            a BottomSheet with every field, including the model picker — see
            seedance-video-form.tsx for the full rationale. */}
        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <ModalitySwitcherMobile type="text-to-video" />
          <MobileOptionsTrigger onClick={() => setSheetOpen(true)} />
          <div className="ml-auto">
            <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy} />
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

          <MobileFieldRow label="Aspect ratio">
            <PillSelect
              icon={RectangleHorizontal}
              value={aspectRatio}
              options={VIDEO_ASPECT_RATIOS}
              onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
            />
          </MobileFieldRow>

          <MobileFieldRow label="Frame rate">
            <PillSelect
              icon={Timer}
              value={fps}
              options={VIDEO_FPS}
              renderLabel={(f) => `${f}fps`}
              onChange={(f) => setValue("fps", f, { shouldValidate: true })}
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
            icon={RectangleHorizontal}
            value={aspectRatio}
            options={VIDEO_ASPECT_RATIOS}
            onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
          />

          <PillSelect
            icon={Timer}
            value={fps}
            options={VIDEO_FPS}
            renderLabel={(f) => `${f}fps`}
            onChange={(f) => setValue("fps", f, { shouldValidate: true })}
          />
        </div>

          <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy} />
        </div>
      </ComposerShell>
    </form>
  );
}
