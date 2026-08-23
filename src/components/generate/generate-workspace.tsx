"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Zap, Video, Wand2, Image as ImageIcon, AudioLines, ChevronDown, type LucideIcon } from "lucide-react";
import { TextToVideoForm } from "./text-to-video-form";
import { ImageToVideoForm } from "./image-to-video-form";
import { TextToImageForm } from "./text-to-image-form";
import { JobStatusCard } from "./job-status-card";
import { useGeneration } from "@/hooks/use-generation";
import { cn, formatCredits } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import {
  VIDEO_MODELS,
  IMAGE_MODELS,
  SEEDANCE2_RESOLUTIONS,
  SEEDANCE2_ASPECT_RATIOS,
  type VideoModelId,
  type ImageModelId,
  type GenerationType,
} from "@/lib/constants";

type UsageResponse = { credit_balance: number };

// Keep in sync with the literal "[zoom:0.7]" class on the hero/result column
// below — Tailwind arbitrary-value classes have to stay string literals for
// its build-time scanner to pick them up, so this can't be derived from one
// shared source.
const HERO_ZOOM = 0.7;

// Each modality is its own route (/generate, /generate/image-to-video,
// /generate/image) rather than client-side tabs — mirrors ArtCraft's
// separate /create-video, /create-image pages, and makes each mode
// independently linkable/bookmarkable.
const MODALITIES: {
  type: GenerationType;
  href: string;
  label: string;
  icon: LucideIcon;
  heroTitle: string;
  heroSubtitle: string;
}[] = [
  {
    type: "text-to-video",
    href: "/generate",
    label: "Video",
    icon: Video,
    heroTitle: "Create Video",
    heroSubtitle: "Describe a scene. See it in motion.",
  },
  {
    type: "image-to-video",
    href: "/generate/image-to-video",
    label: "Image to Video",
    icon: Wand2,
    heroTitle: "Animate an Image",
    heroSubtitle: "Bring a still photo to life.",
  },
  {
    type: "text-to-image",
    href: "/generate/image",
    label: "Image",
    icon: ImageIcon,
    heroTitle: "Create Image",
    heroSubtitle: "Describe a scene. See it rendered.",
  },
];

export function GenerateStudio({ type }: { type: GenerationType }) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeIsVideo, setActiveIsVideo] = useState(true);
  const generation = useGeneration(activeJobId);
  const active = MODALITIES.find((m) => m.type === type) ?? MODALITIES[0];

  // The composer's pill row (model, duration, resolution, aspect ratio,
  // format, settings, submit) wraps onto more lines the narrower the
  // viewport gets, so its real height varies a lot — a fixed pb-* guess on
  // the scroll container above either wastes space on desktop or (on a
  // narrow phone, where it wraps to 3-4 rows) isn't enough, letting the
  // fixed-positioned composer bar cover the "Create" hero text behind it.
  // Measuring the actual rendered height keeps them from ever overlapping.
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(0);
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setComposerHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Deep-link support — e.g. "Use this prompt" from /prompts lands on
  // /generate (text-to-video) with ?model=&prompt= pre-filled. Read once:
  // these only seed initial state, they don't stay in sync with the form
  // afterwards.
  const searchParams = useSearchParams();
  const requestedModel = searchParams.get("model");
  const initialModel = VIDEO_MODELS.some((m) => m.id === requestedModel)
    ? (requestedModel as VideoModelId)
    : undefined;
  const initialImageModel = IMAGE_MODELS.some((m) => m.id === requestedModel)
    ? (requestedModel as ImageModelId)
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

  return (
    // The fixed composer bar below is deliberately OUTSIDE this [zoom:0.7]
    // wrapper: zoom scales an element's own box model (padding included),
    // so the bar's lg:pl-64 sidebar clearance would itself shrink
    // if it were a zoomed descendant, overlapping the (unzoomed, real
    // 240px-wide) sidebar. Keeping it a sibling means its own positioning
    // math stays true-scale regardless of the hero/result column's zoom.
    <>
      <div className="flex h-full flex-col [zoom:0.7]">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Mobile: a single "Video ▾"-style dropdown trigger instead of the
              full pill row — four pills (two of them two-word labels) never
              comfortably fit in one line under ~380px, and a compact
              dropdown reads more like a native app switcher (see e.g.
              Artlist's mobile composer) than a horizontally-scrolling tab
              bar does. */}
          <div className="sm:hidden">
            <DropdownRoot>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="glass inline-flex items-center gap-2 rounded-full py-2 pr-3 pl-4 text-label font-medium text-ink-soft"
                >
                  <active.icon className="size-4 text-brand" aria-hidden="true" />
                  {active.label}
                  <ChevronDown className="size-3.5 text-muted" aria-hidden="true" />
                </button>
              </DropdownTrigger>
              <DropdownContent align="start" className="w-56">
                {MODALITIES.map((m) => (
                  <DropdownItem key={m.type} asChild className={cn(m.type === type && "text-brand")}>
                    <Link href={m.href} className="flex items-center gap-2.5">
                      <m.icon className="size-4" aria-hidden="true" />
                      {m.label}
                    </Link>
                  </DropdownItem>
                ))}
                <div className="flex cursor-not-allowed items-center gap-2.5 px-4 py-3 text-label text-muted opacity-50">
                  <AudioLines className="size-4" aria-hidden="true" />
                  Audio to Video
                </div>
              </DropdownContent>
            </DropdownRoot>
          </div>

          {/* Desktop: full pill row. overflow-x-auto + shrink-0/whitespace-nowrap
              on each pill (same pattern as settings-nav.tsx) is kept as a
              belt-and-suspenders fallback for in-between widths. */}
          <div className="glass hidden max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 sm:flex">
            {MODALITIES.map((m) => (
              <Link
                key={m.type}
                href={m.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-label font-medium whitespace-nowrap transition-colors",
                  m.type === type
                    ? "bg-[image:var(--gradient-primary)] text-white shadow-glow-sm"
                    : "text-muted hover:text-ink-soft",
                )}
              >
                {m.label}
              </Link>
            ))}
            <span
              title="Coming soon"
              className="shrink-0 cursor-not-allowed rounded-full px-4 py-2 text-label font-medium whitespace-nowrap text-muted opacity-50"
            >
              Audio to Video
            </span>
          </div>

          {usageQuery.data && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-body-sm text-ink-soft">
              <Zap className="size-4 text-brand" aria-hidden="true" />
              <span className="font-semibold">{formatCredits(usageQuery.data.credit_balance)}</span>
              <span className="text-muted">credits remaining</span>
            </div>
          )}
        </div>

        {/* Bottom padding clears the fixed composer bar docked below — see
            the composerHeight measurement above. This div lives inside the
            [zoom:0.7] wrapper but composerHeight was measured outside it
            (real, unzoomed pixels), so it has to be scaled back up — zoom
            shrinks how far a given padding value reaches on screen, same
            reason the composer bar itself is kept a sibling of this wrapper
            rather than a descendant. pb-56 is just the fallback for the
            first paint before ResizeObserver reports a real height. */}
        <div
          className={cn("mt-6 flex-1 overflow-y-auto", !composerHeight && "pb-56")}
          style={composerHeight ? { paddingBottom: (composerHeight + 32) / HERO_ZOOM } : undefined}
        >
          {hasJob ? (
            <div className="mx-auto w-full max-w-4xl">
              <JobStatusCard generation={generation} hasJob={hasJob} isVideo={activeIsVideo} />
            </div>
          ) : (
            <div className="relative flex h-full min-h-[50vh] flex-col items-center justify-center overflow-hidden text-center">
              <div
                className="pointer-events-none absolute size-[32rem] rounded-full opacity-30 blur-3xl"
                style={{ background: "var(--gradient-primary-radial)" }}
                aria-hidden="true"
              />
              <span className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-glow-md">
                <Sparkles className="size-7 text-white" aria-hidden="true" />
              </span>
              <h2 className="relative text-display font-bold text-ink">{active.heroTitle}</h2>
              <p className="relative mt-3 text-body text-muted">{active.heroSubtitle}</p>
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
        <div ref={composerRef} className="pointer-events-auto w-full">
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
          {type === "text-to-image" && (
            <TextToImageForm
              onCreated={handleCreated(false)}
              busy={busy}
              initialModel={initialImageModel}
              initialPrompt={initialPrompt}
            />
          )}
        </div>
      </div>
    </>
  );
}
