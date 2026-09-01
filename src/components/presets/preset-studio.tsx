"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  Info,
  Pencil,
  Sparkles,
  Wand2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PanelDropzone, CreditsSubmitPill } from "@/components/generate/composer";
import { JobStatusCard } from "@/components/generate/job-status-card";
import { useGeneration } from "@/hooks/use-generation";
import { useInvalidateCredits, useUsage } from "@/hooks/use-credits";
import { useLazyVideo } from "@/hooks/use-lazy-video";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { PRESET_MODEL_ID, resolvePresetSettings, type ViralPreset } from "@/lib/viral-presets";

/**
 * The one-image preset runner: a locked recipe on the left with a single
 * upload slot and a Generate button, the result canvas on the right.
 *
 * Everything the /generate composer exposes as a control — prompt, duration,
 * resolution, camera, audio — is fixed by the preset here and deliberately
 * not editable. Someone who wants to change any of it belongs in the full
 * composer, not in a second half-composer bolted onto this page.
 */
export function PresetStudio({ preset }: { preset: ViralPreset }) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  const usageQuery = useUsage();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const generation = useGeneration(activeJobId);
  // Opens on the walkthrough rather than an empty result canvas — until a
  // generation is running there is nothing to look at on the Result tab, and
  // the three steps are what a first-time visitor actually needs. Submitting
  // flips it over (see the mutation below), so the switch is never manual.
  const [tab, setTab] = useState<"how" | "result">("how");

  // The preset's settings, stepped down to whatever the current plan can
  // actually submit — see resolvePresetSettings for why this isn't silent.
  const settings = resolvePresetSettings(preset, usageQuery.data?.tier_info);
  const credits = estimateVideoCredits(PRESET_MODEL_ID, settings.duration, settings.resolution);

  const busy = generation.status === "queued" || generation.status === "processing";

  async function handleFile(file: File) {
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setImageUrl(json.url);
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setPreview(null);
    setImageUrl(null);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/generations/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: PRESET_MODEL_ID,
          prompt: preset.prompt,
          image: imageUrl,
          duration: settings.duration,
          resolution: settings.resolution,
          cameraFixed: preset.cameraFixed,
          generateAudio: preset.generateAudio,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      return json;
    },
    onSuccess: (data) => {
      setActiveJobId(data.id);
      setTab("result");
      invalidateCredits();
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't start generation", description: err.message, variant: "error" });
    },
  });

  const blockedReason = settings.blockedReason ?? (imageUrl ? undefined : "Upload an image first.");

  return (
    // Same studio frame as /generate (see generate-workspace.tsx) — the 8rem
    // is the app header plus <main>'s vertical padding.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!blockedReason) mutation.mutate();
      }}
      className="flex flex-col gap-4 lg:h-[calc(100vh-8rem)] lg:flex-row"
    >
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[400px] xl:w-[430px]">
        <PresetHeaderCard preset={preset} />

        {/* overflow-hidden + an inner scroll area is load-bearing: the column
            has a fixed height on lg, so this card is min-h-0 and free to
            shrink under its own content. Without a scroll container that
            content just spilled out of the card and rendered on top of the
            Generate button below it. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-floating">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
            <span className="text-label font-medium text-ink-soft">Your image</span>
            <span className="text-caption text-muted">Required</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
            <PanelDropzone
              className="min-h-48 flex-1"
              label="Upload image"
              sublabel="Select a PNG or JPG from your device"
              previewUrl={preview}
              uploading={uploading}
              onFile={handleFile}
              onRemove={clearImage}
            />

            <p className="shrink-0 text-caption text-muted">{preset.imageHint}</p>

            {settings.notes.map((note) => (
              <p key={note} className="flex shrink-0 items-start gap-1.5 text-caption text-warning">
                <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                {note}
              </p>
            ))}

            {/* Locked, but not hidden — the recipe is readable on demand so a
                preset doesn't read as a black box, and so anyone who wants to
                adapt it can lift it into the full composer. */}
            <details className="shrink-0 rounded-xl border border-line bg-surface-dark">
              <summary className="cursor-pointer px-3.5 py-2.5 text-caption font-medium text-muted transition-colors hover:text-ink-soft">
                What this preset does
              </summary>
              <div className="border-t border-line px-3.5 py-3">
                <pre className="font-mono text-caption whitespace-pre-wrap text-ink-soft">
                  {preset.prompt}
                </pre>
              </div>
            </details>
          </div>
        </div>

        <CreditsSubmitPill
          fullWidth
          credits={credits}
          loading={mutation.isPending || busy || uploading}
          balance={usageQuery.data?.credit_balance}
          blockedReason={blockedReason}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList className="shrink-0 border-b-0">
            <TabsTrigger value="how">How it works</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>

          <TabsContent value="how" className="min-h-0 flex-1 focus:outline-none">
            <HowItWorks />
          </TabsContent>

          <TabsContent value="result" className="min-h-0 flex-1 focus:outline-none">
            <div className="h-full min-h-[24rem]">
              <JobStatusCard
                generation={generation}
                hasJob={Boolean(activeJobId)}
                isVideo
                onReset={() => setActiveJobId(null)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </form>
  );
}

/** The preset itself, as a looping thumbnail with its name over it — the
 * "you picked this one" anchor, plus the way back to the gallery. */
function PresetHeaderCard({ preset }: { preset: ViralPreset }) {
  const { containerRef, videoRef, hasLoadedOnce } = useLazyVideo();

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-line bg-surface-3 shadow-floating"
    >
      {hasLoadedOnce && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={preset.previewUrl} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" aria-hidden="true" />

      <Link
        href="/presets"
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-black/60 px-3 py-1.5 text-caption font-semibold text-ink backdrop-blur-sm transition-colors hover:border-border-strong hover:bg-black/80"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        Change
      </Link>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h1 className="font-display text-feature-title font-bold text-ink uppercase">{preset.title}</h1>
        <p className="mt-1 text-caption text-white/70">{preset.tagline}</p>
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Wand2,
    title: "Pick a preset",
    body: "Every preset is a finished recipe — the prompt, the camera move, the length and the audio are already written. You never have to describe anything.",
  },
  {
    icon: ImagePlus,
    title: "Upload one image",
    body: "Drop in a JPG, PNG or WEBP. That photo becomes the reference the whole clip is built from, so your subject stays your subject.",
  },
  {
    icon: Download,
    title: "Generate and download",
    body: "One tap, usually under a minute. Download the result straight from the canvas — it's also saved to your gallery.",
  },
];

/** Three-card walkthrough with arrows and dots, matching the reference
 * layout. Local index rather than a routed/parameterised carousel: nothing
 * else on the page cares which step is on screen. */
function HowItWorks() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const Icon = step.icon;

  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-surface-2 p-6 text-center shadow-card">
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand shadow-glow-md">
          <Icon className="size-7 text-on-brand" aria-hidden="true" />
        </span>
        <h2 className="font-display text-subheading font-bold text-ink">{step.title}</h2>
        <p className="text-body text-muted">{step.body}</p>
      </div>

      <div className="flex items-center gap-4">
        <CarouselArrow
          direction="prev"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        />
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-brand" : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>
        <CarouselArrow
          direction="next"
          disabled={index === STEPS.length - 1}
          onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
        />
      </div>

      <p className="flex items-center gap-1.5 text-caption text-muted">
        <Sparkles className="size-3" aria-hidden="true" />
        Want to change the prompt or settings?{" "}
        <Link href="/generate" className="text-brand underline-offset-4 hover:underline">
          Open the full composer
        </Link>
      </p>
    </div>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous step" : "Next step"}
      className="flex size-9 items-center justify-center rounded-full border border-line bg-surface-3 text-muted transition-colors hover:border-border-strong hover:text-ink-soft disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
