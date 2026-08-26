"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/marketing/tilt-card";
import { SEEDANCE25_SHOWCASE_VIDEOS, type ShowcaseVideo } from "@/lib/showcase-media";
import { GPT_IMAGE_2_IMAGES, type GptImage2Image } from "@/lib/gpt-image-2-showcase";
import { IMAGE_MODELS, VIDEO_MODELS, SEEDANCE_MODEL_ID } from "@/lib/constants";
import { useLazyVideo } from "@/hooks/use-lazy-video";

// Every curated video sample comes from the same live model (Seedance 2.5);
// every curated image sample comes from the same live model (GPT Image 2).
// Reading the id from the registry (not retyping it) means it stays correct
// even though some Cloudflare catalog ids carry leading-whitespace
// corruption (see cloudflare-models.ts) — round-tripping the id verbatim
// through the URL still lands back on the same registry entry.
const SEEDANCE_25 = VIDEO_MODELS.find((m) => m.id === SEEDANCE_MODEL_ID);
const GPT_IMAGE_2 = IMAGE_MODELS.find((m) => m.label === "GPT Image 2");

// CSS-column masonry (higgsfield-style preset gallery) rather than a fixed
// grid-flow-dense bento — item height drives the offset layout naturally,
// and `break-inside-avoid` keeps each card intact across columns.
const VIDEO_ASPECT: Record<ShowcaseVideo["tile"], string> = {
  wide: "aspect-video",
  tall: "aspect-[3/4]",
  square: "aspect-square",
};

// Whole card is the click target — a single "Try this model" affordance
// rather than a separate nested link/button inside the card (keeps the
// touch target large and avoids nested-interactive-element a11y issues).
// No badge/caption chrome on the tile itself — matches the image grid's
// poster-wall look; the model identity is already stated once in the
// section header above, and the aria-label carries the prompt for a11y.
function VideoTile({ video }: { video: ShowcaseVideo }) {
  const { containerRef, videoRef, hasLoadedOnce } = useLazyVideo<HTMLAnchorElement>();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const targetModelId = SEEDANCE_25?.id ?? SEEDANCE_MODEL_ID;
  const tryHref = `/generate?model=${encodeURIComponent(targetModelId)}&prompt=${encodeURIComponent(video.prompt)}`;

  return (
    <TiltCard className="mb-2 block break-inside-avoid overflow-hidden rounded-lg sm:mb-3">
      <Link
        href={tryHref}
        ref={containerRef}
        aria-label={`Try Seedance 2.5 with prompt: ${video.prompt}`}
        className={cn("group relative block w-full bg-surface-2", VIDEO_ASPECT[video.tile])}
      >
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
                "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
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
      </Link>
    </TiltCard>
  );
}

// Renders each image at its own natural aspect ratio (no forced crop) so
// the column layout produces a genuinely uneven, poster-wall masonry —
// matching higgsfield's Explore grid exactly: plain images, no per-tile
// badge/caption chrome (the model identity is carried once by the section
// header above the grid, not repeated on every tile). The whole tile is
// still the tap target for "Try this model", just without a visible label.
function ImageTile({ image }: { image: GptImage2Image }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const tryHref = GPT_IMAGE_2
    ? `/generate/image?model=${encodeURIComponent(GPT_IMAGE_2.id)}&prompt=${encodeURIComponent(image.prompt)}`
    : "/generate/image";

  return (
    <TiltCard className="mb-2 block break-inside-avoid overflow-hidden rounded-lg sm:mb-3">
      <Link href={tryHref} title={image.prompt} className="group relative block w-full bg-surface-2">
        {!loaded && !errored && (
          <div className="aspect-[3/4] w-full animate-pulse bg-gradient-to-br from-surface-3 to-surface-2" />
        )}

        {errored ? (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-surface-3 to-brand/10">
            <Play className="size-8 text-muted" aria-hidden="true" />
          </div>
        ) : (
          // No loading="lazy" here: native lazy-loading inside a CSS multi-column
          // (columns-*) masonry has a long-standing Chromium bug where the
          // load-distance calculation misfires and the image never crosses the
          // threshold, especially combined with a zero-height skeleton state
          // like this tile's — the image gets stuck forever. Eager-loading a
          // gallery of ~8 images is not a real perf concern.
          // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/ghost CDN thumbnails, no next/image domain config for these hosts
          <img
            src={image.url}
            alt={image.prompt}
            className={cn(
              "block w-full rounded-lg transition-transform duration-500 group-hover:scale-105",
              loaded ? "h-auto opacity-100" : "h-0 opacity-0",
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}
      </Link>
    </TiltCard>
  );
}

// higgsfield's Explore page states the model identity once, as a page
// header (name + tagline), rather than repeating it on every tile — and
// every model's section is always on the page, not gated behind a tab
// switch. With only two live models here, both sections render stacked.
function ShowcaseSection({
  name,
  description,
  children,
}: {
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-heading font-extrabold uppercase tracking-tight text-brand">{name}</h3>
      <p className="mt-1 text-body text-muted">{description}</p>
      <div className="mt-6 columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">{children}</div>
    </div>
  );
}

export function ShowcaseTabs() {
  return (
    <div className="space-y-16">
      {SEEDANCE_25 && (
        <ShowcaseSection name={SEEDANCE_25.label} description={SEEDANCE_25.description}>
          {SEEDANCE25_SHOWCASE_VIDEOS.map((video) => (
            <VideoTile key={video.id} video={video} />
          ))}
        </ShowcaseSection>
      )}

      {GPT_IMAGE_2 && (
        <ShowcaseSection name={GPT_IMAGE_2.label} description={GPT_IMAGE_2.description}>
          {GPT_IMAGE_2_IMAGES.map((image) => (
            <ImageTile key={image.id} image={image} />
          ))}
        </ShowcaseSection>
      )}
    </div>
  );
}
