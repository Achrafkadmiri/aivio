"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/marketing/tilt-card";
import { SHOWCASE_VIDEOS, type ShowcaseVideo } from "@/lib/showcase-media";
import { NANO_BANANA_IMAGES, type NanoBananaImage } from "@/lib/nano-banana-showcase";
import { IMAGE_MODELS, SEEDANCE2_MODEL_ID } from "@/lib/constants";

// Every curated video sample comes from the same live model (Seedance 2.0);
// every curated image sample comes from the same live model (Nano Banana 2
// Lite). Reading the id from the registry (not retyping it) means it stays
// correct even though some Cloudflare catalog ids carry leading-whitespace
// corruption (see cloudflare-models.ts) — round-tripping the id verbatim
// through the URL still lands back on the same registry entry.
const NANO_BANANA_MODEL = IMAGE_MODELS.find((m) => m.label === "Nano Banana 2 Lite");

const VIDEO_TILE_SPAN: Record<ShowcaseVideo["tile"], string> = {
  wide: "sm:col-span-2",
  tall: "row-span-2",
  square: "",
};

const ROTATIONS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

function TryModelLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="pointer-events-auto inline-flex w-fit items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] leading-4 font-semibold text-black opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 hover:bg-white"
    >
      Try this model
      <ArrowUpRight className="size-3" aria-hidden="true" />
    </Link>
  );
}

function ModelBadge({ label }: { label: string }) {
  return (
    <span className="pointer-events-none inline-flex w-fit items-center rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] leading-4 font-medium text-ink-soft backdrop-blur">
      {label}
    </span>
  );
}

function VideoTile({ video, index }: { video: ShowcaseVideo; index: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasLoadedOnce(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (inView) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [inView, hasLoadedOnce]);

  const tryHref = `/generate?model=${encodeURIComponent(SEEDANCE2_MODEL_ID)}&prompt=${encodeURIComponent(video.prompt)}`;

  return (
    <div
      className={cn(
        "transition-transform duration-300 ease-out hover:rotate-0 hover:z-10",
        ROTATIONS[index % ROTATIONS.length],
        VIDEO_TILE_SPAN[video.tile],
      )}
    >
      <TiltCard className="h-full overflow-hidden rounded-xl">
        <div ref={containerRef} className="group relative h-full w-full bg-surface-2">
          {!loaded && !errored && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-3 to-surface-2" />
          )}

          {errored ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-3 to-brand/10">
              <Play className="size-8 text-muted" aria-hidden="true" />
            </div>
          ) : (
            hasLoadedOnce && (
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                  loaded ? "opacity-100" : "opacity-0",
                )}
                muted
                loop
                playsInline
                preload="none"
                onLoadedData={() => setLoaded(true)}
                onError={() => setErrored(true)}
              >
                <source src={video.url} type="video/mp4" />
              </video>
            )
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 via-black/10 to-black/0 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ModelBadge label="Seedance 2.0" />
            <div className="flex flex-col items-start gap-2">
              <p className="line-clamp-2 font-mono text-caption text-ink-soft">{video.prompt}</p>
              <TryModelLink href={tryHref} />
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

function ImageTile({ image, index }: { image: NanoBananaImage; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const tryHref = NANO_BANANA_MODEL
    ? `/generate/image?model=${encodeURIComponent(NANO_BANANA_MODEL.id)}&prompt=${encodeURIComponent(image.prompt)}`
    : "/generate/image";

  return (
    <div
      className={cn(
        "transition-transform duration-300 ease-out hover:rotate-0 hover:z-10",
        ROTATIONS[index % ROTATIONS.length],
      )}
    >
      <TiltCard className="h-full overflow-hidden rounded-xl">
        <div className="group relative h-full w-full bg-surface-2">
          {!loaded && !errored && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-3 to-surface-2" />
          )}

          {errored ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-3 to-brand/10">
              <Play className="size-8 text-muted" aria-hidden="true" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/ghost CDN thumbnails, no next/image domain config for these hosts
            <img
              src={image.url}
              alt={image.prompt}
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                loaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
            />
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 via-black/10 to-black/0 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ModelBadge label="Nano Banana 2 Lite" />
            <div className="flex flex-col items-start gap-2">
              <p className="line-clamp-2 font-mono text-caption text-ink-soft">{image.prompt}</p>
              <TryModelLink href={tryHref} />
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

const TABS = [
  { id: "videos", label: "Videos" },
  { id: "images", label: "Generated Images" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ShowcaseTabs() {
  const [tab, setTab] = useState<TabId>("videos");

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-line bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-label font-medium transition-colors",
              tab === t.id
                ? "bg-[image:var(--gradient-primary)] text-white shadow-glow-sm"
                : "text-muted hover:text-ink-soft",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "videos" ? (
          <div className="grid auto-rows-[180px] grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:auto-rows-[220px]">
            {SHOWCASE_VIDEOS.map((video, index) => (
              <VideoTile key={video.id} video={video} index={index} />
            ))}
          </div>
        ) : (
          <div className="grid auto-rows-[220px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:auto-rows-[260px]">
            {NANO_BANANA_IMAGES.map((image, index) => (
              <ImageTile key={image.id} image={image} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
