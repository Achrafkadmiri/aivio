"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/marketing/tilt-card";
import { SHOWCASE_VIDEOS, type ShowcaseVideo } from "@/lib/showcase-media";

const TILE_SPAN: Record<ShowcaseVideo["tile"], string> = {
  wide: "sm:col-span-2",
  tall: "row-span-2",
  square: "",
};

// Small alternating tilt per tile — breaks the dense grid's otherwise
// perfectly axis-aligned cells into a looser, scattered-clips feel.
// Straightens out on hover as a small interactive reward.
const ROTATIONS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

function ShowcaseTile({ video, index }: { video: ShowcaseVideo; index: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Stays subscribed for the tile's whole lifetime (unlike a one-shot
  // observer) so playback can pause when the tile scrolls out of view and
  // resume when it scrolls back — without ever re-fetching the video.
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
      videoEl.play().catch(() => {
        // Autoplay can be blocked by the browser — hover/tap still works
        // once the user interacts with the page.
      });
    } else {
      videoEl.pause();
    }
  }, [inView, hasLoadedOnce]);

  return (
    <div
      className={cn(
        "transition-transform duration-300 ease-out hover:rotate-0 hover:z-10",
        ROTATIONS[index % ROTATIONS.length],
        TILE_SPAN[video.tile],
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

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/0 to-black/0 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="line-clamp-2 font-mono text-caption text-ink-soft">{video.prompt}</p>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

export function ShowcaseGrid() {
  return (
    <div className="grid auto-rows-[180px] grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:auto-rows-[220px]">
      {SHOWCASE_VIDEOS.map((video, index) => (
        <ShowcaseTile key={video.id} video={video} index={index} />
      ))}
    </div>
  );
}
