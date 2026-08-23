"use client";

import { useMutation } from "@tanstack/react-query";
import { useInvalidateCredits } from "@/hooks/use-credits";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Maximize, RectangleHorizontal, Palette } from "lucide-react";
import { FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { estimateImageCredits } from "@/lib/credit-estimate";
import { textToImageSchema, type TextToImageInput } from "@/lib/validation";
import { IMAGE_RESOLUTIONS, IMAGE_ASPECT_RATIOS, IMAGE_STYLE_PRESETS, type ImageModelId } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import {
  ComposerShell,
  ComposerPromptField,
  ComposerSecondaryField,
  ProviderModelPicker,
  PillSelect,
  CreditsSubmitPill,
  type PickerModel,
} from "./composer";

const STYLE_OPTIONS = ["None", ...IMAGE_STYLE_PRESETS] as const;

export function GenericImageForm({
  models,
  model,
  onModelChange,
  initialPrompt,
  onPromptChange,
  onCreated,
  busy,
}: {
  models: readonly PickerModel<ImageModelId>[];
  model: ImageModelId;
  onModelChange: (id: ImageModelId) => void;
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextToImageInput>({
    resolver: zodResolver(textToImageSchema) as Resolver<TextToImageInput>,
    defaultValues: {
      model,
      prompt: initialPrompt,
      resolution: "1024x1024",
      aspectRatio: "1:1",
    },
  });

  const prompt = watch("prompt") ?? "";
  const resolution = watch("resolution");
  const aspectRatio = watch("aspectRatio");
  const style = watch("style") || "None";
  const estimatedCredits = estimateImageCredits(model);

  const mutation = useMutation({
    mutationFn: async (data: TextToImageInput) => {
      const res = await apiFetch("/api/generations/text-to-image", {
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
                  placeholder="Describe the image you imagine"
                  maxLength={500}
                />
              )}
            />
            <FieldError>{errors.prompt?.message}</FieldError>

            <Controller
              control={control}
              name="negativePrompt"
              render={({ field }) => (
                <ComposerSecondaryField
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Negative prompt — blurry, low quality, watermark…"
                />
              )}
            />
          </div>

          <span className="mt-3 shrink-0 text-caption text-muted">{prompt.length}/500</span>
        </div>

        {/* Pills scroll horizontally instead of wrapping onto more rows — see
            seedance-video-form.tsx for the full rationale. Submit stays a
            sibling of the scroll area so it's always visible. */}
        <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <ProviderModelPicker models={models} value={model} onChange={onModelChange} />

          <PillSelect
            icon={Maximize}
            value={resolution}
            options={IMAGE_RESOLUTIONS}
            onChange={(r) => setValue("resolution", r, { shouldValidate: true })}
          />

          <PillSelect
            icon={RectangleHorizontal}
            value={aspectRatio}
            options={IMAGE_ASPECT_RATIOS}
            onChange={(a) => setValue("aspectRatio", a, { shouldValidate: true })}
          />

          <PillSelect
            icon={Palette}
            value={style}
            options={STYLE_OPTIONS}
            onChange={(s) =>
              setValue("style", s === "None" ? undefined : s, { shouldValidate: true })
            }
          />
        </div>

          <CreditsSubmitPill credits={estimatedCredits} loading={mutation.isPending || busy} />
        </div>
      </ComposerShell>
    </form>
  );
}
