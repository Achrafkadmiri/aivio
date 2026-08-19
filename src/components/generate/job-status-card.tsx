"use client";

import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { useGeneration } from "@/hooks/use-generation";

type Generation = ReturnType<typeof useGeneration>;

export function JobStatusCard({
  generation,
  hasJob,
  isVideo,
}: {
  generation: Generation;
  hasJob: boolean;
  isVideo: boolean;
}) {
  if (!hasJob) {
    return (
      <Card
        variant="standard"
        className="sticky top-24 flex flex-col items-center gap-3 rounded-xl py-16 text-center"
      >
        <Sparkles className="size-8 text-muted" aria-hidden="true" />
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
        className="sticky top-24 flex flex-col items-center gap-3 rounded-xl py-16 text-center"
      >
        <XCircle className="size-8 text-accent" aria-hidden="true" />
        <p className="text-body-sm text-ink-soft">{generation.error ?? "Generation failed."}</p>
      </Card>
    );
  }

  if (generation.status === "completed" && generation.result) {
    return (
      <Card variant="standard" className="sticky top-24 rounded-xl">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <span className="text-label">Done</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          {isVideo ? (
            <video
              src={generation.result.resultUrl}
              controls
              autoPlay
              loop
              muted
              className="w-full"
            />
          ) : (
            // Intentionally plain <img>: the result can be any aspect ratio
            // (square Picsum samples, arbitrary model output, ...) and this
            // scales to container width at its natural height — next/image
            // needs a fixed box (fill) or known dimensions, either of which
            // would force/crop an aspect ratio we don't actually know here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.result.resultUrl}
              alt="Generation result"
              className="w-full"
            />
          )}
        </div>
        <a
          href={generation.result.resultUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="mt-4 block"
        >
          <Button className="w-full">Download</Button>
        </a>
      </Card>
    );
  }

  return (
    <Card
      variant="standard"
      className="sticky top-24 flex flex-col items-center gap-4 rounded-xl py-16 text-center"
    >
      <Loader2 className="size-8 animate-spin text-brand" aria-hidden="true" />
      <div className="w-full">
        <p className="text-body-sm text-ink-soft">
          {generation.status === "queued" ? "Queued…" : "Generating…"}
        </p>
        <Progress value={generation.progress} className="mt-3" />
        <p className="mt-2 font-mono text-caption text-muted">{generation.progress}%</p>
      </div>
    </Card>
  );
}
