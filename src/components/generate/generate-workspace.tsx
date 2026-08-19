"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { TextToVideoForm } from "./text-to-video-form";
import { ImageToVideoForm } from "./image-to-video-form";
import { TextToImageForm } from "./text-to-image-form";
import { JobStatusCard } from "./job-status-card";
import { useGeneration } from "@/hooks/use-generation";
import { cn, formatCredits } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import {
  VIDEO_MODELS,
  SEEDANCE2_RESOLUTIONS,
  SEEDANCE2_ASPECT_RATIOS,
  type VideoModelId,
  type GenerationType,
} from "@/lib/constants";

type UsageResponse = { credits_used_this_month: number; credits_limit: number | null };

// Each modality is its own route (/generate, /generate/image-to-video,
// /generate/image) rather than client-side tabs — mirrors ArtCraft's
// separate /create-video, /create-image pages, and makes each mode
// independently linkable/bookmarkable.
const MODALITIES: {
  type: GenerationType;
  href: string;
  label: string;
  heroTitle: string;
  heroSubtitle: string;
}[] = [
  {
    type: "text-to-video",
    href: "/generate",
    label: "Video",
    heroTitle: "Create Video",
    heroSubtitle: "Describe a scene. See it in motion.",
  },
  {
    type: "image-to-video",
    href: "/generate/image-to-video",
    label: "Image to Video",
    heroTitle: "Animate an Image",
    heroSubtitle: "Bring a still photo to life.",
  },
  {
    type: "text-to-image",
    href: "/generate/image",
    label: "Image",
    heroTitle: "Create Image",
    heroSubtitle: "Describe a scene. See it rendered.",
  },
];

export function GenerateStudio({ type }: { type: GenerationType }) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeIsVideo, setActiveIsVideo] = useState(true);
  const generation = useGeneration(activeJobId);
  const active = MODALITIES.find((m) => m.type === type) ?? MODALITIES[0];

  // Deep-link support — e.g. "Use this prompt" from /prompts lands on
  // /generate (text-to-video) with ?model=&prompt= pre-filled. Read once:
  // these only seed initial state, they don't stay in sync with the form
  // afterwards.
  const searchParams = useSearchParams();
  const requestedModel = searchParams.get("model");
  const initialModel = VIDEO_MODELS.some((m) => m.id === requestedModel)
    ? (requestedModel as VideoModelId)
    : undefined;
  const initialPrompt = searchParams.get("prompt") ?? undefined;
  const requestedDuration = Number(searchParams.get("duration"));
  const requestedResolution = searchParams.get("resolution");
  const requestedAspectRatio = searchParams.get("aspectRatio");
  const initialParams = {
    duration: Number.isFinite(requestedDuration) && requestedDuration > 0 ? requestedDuration : undefined,
    resolution: SEEDANCE2_RESOLUTIONS.some((r) => r === requestedResolution)
      ? (requestedResolution as (typeof SEEDANCE2_RESOLUTIONS)[number])
      : undefined,
    aspectRatio: SEEDANCE2_ASPECT_RATIOS.some((a) => a === requestedAspectRatio)
      ? (requestedAspectRatio as (typeof SEEDANCE2_ASPECT_RATIOS)[number])
      : undefined,
  };

  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await apiFetch("/api/user/usage");
      if (!res.ok) throw new Error("Failed to load usage");
      return res.json();
    },
  });

  const busy = generation.status === "queued" || generation.status === "processing";
  const hasJob = Boolean(activeJobId);

  function handleCreated(isVideo: boolean) {
    return (jobId: string) => {
      setActiveIsVideo(isVideo);
      setActiveJobId(jobId);
    };
  }

  const remaining =
    usageQuery.data && usageQuery.data.credits_limit !== null
      ? Math.max(0, usageQuery.data.credits_limit - usageQuery.data.credits_used_this_month)
      : null;

  return (
    // The fixed composer bar below is deliberately OUTSIDE this [zoom:0.7]
    // wrapper: zoom scales an element's own box model (padding included),
    // so the bar's lg:pl-64 sidebar clearance would itself shrink
    // if it were a zoomed descendant, overlapping the (unzoomed, real
    // 240px-wide) sidebar. Keeping it a sibling means its own positioning
    // math stays true-scale regardless of the hero/result column's zoom.
    <>
      <div className="flex h-full flex-col [zoom:0.7]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1">
            {MODALITIES.map((m) => (
              <Link
                key={m.type}
                href={m.href}
                className={cn(
                  "rounded-full px-4 py-2 text-label font-medium transition-colors",
                  m.type === type ? "bg-ink text-surface" : "text-muted hover:text-ink-soft",
                )}
              >
                {m.label}
              </Link>
            ))}
            <span
              title="Coming soon"
              className="cursor-not-allowed rounded-full px-4 py-2 text-label font-medium text-muted opacity-50"
            >
              Audio to Video
            </span>
          </div>

          {usageQuery.data && (
            <div className="flex items-center gap-2 text-body-sm text-muted">
              <Zap className="size-4 text-brand" aria-hidden="true" />
              {remaining === null
                ? "Unlimited credits"
                : `${formatCredits(remaining)} credits remaining this month`}
            </div>
          )}
        </div>

        {/* pb-56 clears the fixed composer bar docked at the bottom below. */}
        <div className="mt-6 flex-1 overflow-y-auto pb-56">
          {hasJob ? (
            <div className="mx-auto w-full max-w-4xl">
              <JobStatusCard generation={generation} hasJob={hasJob} isVideo={activeIsVideo} />
            </div>
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
              <Sparkles className="mb-4 size-8 text-muted" aria-hidden="true" />
              <h2 className="text-display font-bold text-ink">{active.heroTitle}</h2>
              <p className="mt-3 text-body text-muted">{active.heroSubtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Docked to the bottom of the viewport rather than sitting inline in
          a two-column layout — matches ArtCraft's floating prompt bar, but
          full-width rather than a centered column: it spans the whole
          bottom edge (minus px-4 breathing room). lg:pl-64 clears the
          persistent w-60 sidebar plus a bit of extra breathing room.
          Deliberately
          a sibling of the [zoom:0.7] div above, not a child — see the comment
          on the return's opening fragment. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:pl-64">
        <div className="pointer-events-auto w-full">
          {type === "text-to-video" && (
            <TextToVideoForm
              onCreated={handleCreated(true)}
              busy={busy}
              initialModel={initialModel}
              initialPrompt={initialPrompt}
              initialParams={initialParams}
            />
          )}
          {type === "image-to-video" && (
            <ImageToVideoForm onCreated={handleCreated(true)} busy={busy} />
          )}
          {type === "text-to-image" && <TextToImageForm onCreated={handleCreated(false)} busy={busy} />}
        </div>
      </div>
    </>
  );
}
