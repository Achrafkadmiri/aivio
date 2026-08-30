"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Heart } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// A tile sits still on its first frame and only plays while the pointer is
// on the card — a grid of clips all looping at once is noise, and dozens of
// simultaneous decodes are expensive. Loading still waits for the tile to
// scroll into view, and leaving the viewport pauses playback (scrolling away
// mid-hover) without ever re-fetching.
//
// `#t=0.1` on a source without a thumbnail asks the browser to seek just
// past the start, which is what actually paints a still frame — a plain
// paused <video> with preload="metadata" can stay blank, and clips often
// open on a black frame anyway. Playback resumes from wherever it paused
// rather than rewinding, so re-hovering doesn't restart the clip.
function LazyVideoTile({
  src,
  poster,
  alt,
  playing,
}: {
  src: string;
  poster: string | null;
  alt: string;
  playing: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasLoadedOnce(true);
      },
      { rootMargin: "150px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (playing && inView) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [playing, inView, hasLoadedOnce]);

  return (
    <div ref={containerRef} className="h-full w-full bg-surface-3">
      {hasLoadedOnce && (
        <video
          ref={videoRef}
          className={cn("h-full w-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          src={poster ? src : `${src}#t=0.1`}
          poster={poster ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          onLoadedData={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

export type GalleryItem = {
  id: string;
  type: string;
  model: string;
  prompt: string;
  status: string;
  progressPercent: number;
  resultUrl: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  // Everything below is already on every serialized generation the API
  // returns (see serializeGeneration in the backend) — optional here only
  // because a few local call sites build GalleryItems by hand. The preview
  // modal reads them for its prompt/details panel.
  negativePrompt?: string | null;
  seed?: number | null;
  parameters?: Record<string, unknown> | null;
  costCredits?: number;
  processingTimeSeconds?: number | null;
  errorMessage?: string | null;
  createdAt?: string;
};

export function GenerationCard({
  item,
  onOpen,
  liked = false,
  onToggleLike,
}: {
  item: GalleryItem;
  onOpen: () => void;
  liked?: boolean;
  onToggleLike?: () => void;
}) {
  const isVideo = item.type !== "text-to-image";
  // Tracked on the card root, not the video itself: enter/leave don't fire
  // for moves between a node and its descendants, so drifting onto the like
  // button keeps the clip running instead of stuttering it.
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-border-strong hover:shadow-glow-sm"
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label={`Open ${item.prompt}`}
      >
        {item.status === "completed" && item.resultUrl ? (
          isVideo ? (
            <LazyVideoTile
              src={item.resultUrl}
              poster={item.thumbnailUrl}
              alt={item.prompt}
              playing={hovered}
            />
          ) : (
            <Image
              src={item.resultUrl}
              alt={item.prompt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          )
        ) : item.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-3 p-4 text-center">
            <AlertCircle className="size-6 text-accent" aria-hidden="true" />
            <span className="text-caption text-muted">Generation failed</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-3">
            <Spinner />
            <span className="font-mono text-caption text-muted">{item.progressPercent}%</span>
          </div>
        )}
      </button>

      {/* The only chrome on a tile: everything else (status, prompt, actions)
          now lives in the preview modal. Always visible below sm: — touch
          devices have no hover state, so a hover-only reveal would put the
          heart out of reach. A liked tile keeps its heart on at every size,
          otherwise there's no way to see what you've liked. */}
      {onToggleLike && (
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className={cn(
            "absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-full",
            "bg-black/40 text-white backdrop-blur-sm transition-[opacity,transform,background-color] duration-200",
            "hover:bg-black/60 active:scale-90",
            liked ? "opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
          )}
        >
          <Heart className={cn("size-4.5", liked && "fill-brand text-brand")} aria-hidden="true" />
        </button>
      )}

    </div>
  );
}
