"use client";

import { CheckCircle2, XCircle, Sparkles, RotateCcw, Download as DownloadIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerationLoader } from "./generation-loader";
import type { useGeneration } from "@/hooks/use-generation";

type Generation = ReturnType<typeof useGeneration>;

export function JobStatusCard({
  generation,
  hasJob,
  isVideo,
  onReset,
}: {
  generation: Generation;
  hasJob: boolean;
  isVideo: boolean;
  /** Clears the active job so the idle hero + composer reappear — wired to
   * "Create another" (completed) and "Try again" (failed) below. */
  onReset: () => void;
}) {
  if (!hasJob) {
    // Canvas-style empty placeholder — a dashed frame rather than a plain
    // filled card, so it reads as "this is where your result will render"
    // (ArtCraft/Higgsfield both frame the result area this way) instead of
    // just another content card.
    return (
      <Card
        variant="standard"
        className="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2/50 text-center shadow-none hover:translate-y-0 hover:border-line hover:shadow-none"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/5">
          <Sparkles className="size-6 text-muted" aria-hidden="true" />
        </span>
        <p className="text-body-sm text-muted">
          Your result will appear here once you start a generation.
        </p>
      </Card>
    );
  }

  if (generation.status === "failed") {
    return (
      <Card
        variant="standard"
        className="flex h-full min-h-80 flex-col items-center justify-center gap-4 rounded-2xl text-center hover:translate-y-0 hover:shadow-card"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent/10">
          <XCircle className="size-6 text-accent" aria-hidden="true" />
        </span>
        <p className="max-w-sm text-body-sm text-ink-soft">{generation.error ?? "Generation failed."}</p>
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </Card>
    );
  }

  if (generation.status === "completed" && generation.result) {
    // The card claims the full height the composer leaves free and splits it
    // header / media / actions, with only the media flexing. That's what
    // keeps the result whole and the Download button on screen without
    // scrolling: previously the media rendered at its natural height, so a
    // 16:9 video at card width ran past the fold and pushed the buttons
    // underneath the docked composer bar.
    return (
      <Card
        variant="standard"
        className="flex h-full min-h-80 flex-col gap-4 rounded-2xl p-4 hover:translate-y-0 hover:shadow-card sm:p-5 motion-safe:animate-fade-up"
      >
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <span className="text-label">Done</span>
        </div>

        {/* min-h-0 is load-bearing: without it this flex child refuses to
          * shrink below its content's natural size and the overflow comes
          * straight back. */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-dark shadow-glow-sm">
          {isVideo ? (
            <video
              src={generation.result.resultUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            // Intentionally plain <img>: the result can be any aspect ratio
            // (square Picsum samples, arbitrary model output, ...) and
            // object-contain inside the flexed box shows all of it whatever
            // that ratio turns out to be — next/image needs a fixed box
            // (fill) or known dimensions, either of which would force/crop
            // an aspect ratio we don't actually know here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.result.resultUrl}
              alt="Generation result"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={generation.result.resultUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="sm:flex-1"
          >
            <Button className="w-full">
              <DownloadIcon className="size-4" aria-hidden="true" />
              Download
            </Button>
          </a>
          <Button variant="secondary" onClick={onReset} className="w-full sm:w-auto">
            <Sparkles className="size-4" aria-hidden="true" />
            Create another
          </Button>
        </div>
      </Card>
    );
  }

  // Generating / queued — the frame being rendered stands in for itself
  // (see GenerationLoader). No spinner and no percentage bar: the numbers
  // the provider gives us are too coarse to be worth showing, and a picture
  // of the model working says the same thing without pretending to measure.
  const queued = generation.status === "queued";

  return (
    <Card
      variant="standard"
      className="flex h-full min-h-80 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl text-center hover:translate-y-0 hover:shadow-card"
    >
      <div
        className="pointer-events-none absolute inset-0 animate-pulse opacity-20"
        style={{ background: "var(--gradient-hero-glow)" }}
        aria-hidden="true"
      />

      <GenerationLoader isVideo={isVideo} className="relative px-4" />

      {/* aria-live so a screen reader is told the state changed — the visual
        * above is decorative and carries none of that. */}
      <div className="relative" role="status" aria-live="polite">
        <p className="flex items-center justify-center gap-2 text-body-sm font-medium whitespace-nowrap text-ink">
          <span
            className="size-1.5 rounded-full bg-brand motion-safe:animate-status-pulse"
            aria-hidden="true"
          />
          {queued
            ? "Queued"
            : isVideo
              ? "Painting your video"
              : "Painting your image"}
        </p>
        <p className="mt-1.5 text-caption text-muted">
          {queued
            ? "Waiting for a free slot on the model"
            : "This usually takes under a minute"}
        </p>
      </div>
    </Card>
  );
}
