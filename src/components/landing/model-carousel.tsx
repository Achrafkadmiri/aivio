"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { NANO_BANANA_IMAGES } from "@/lib/nano-banana-showcase";
import { VIDEO_MODELS, IMAGE_MODELS, SEEDANCE2_MODEL_ID } from "@/lib/constants";
import { useLazyVideo } from "@/hooks/use-lazy-video";

const SEEDANCE_2 = VIDEO_MODELS.find((m) => m.id === SEEDANCE2_MODEL_ID);
const NANO_BANANA = IMAGE_MODELS.find((m) => m.label === "Nano Banana 2 Lite");
// `.trim()` guards against the leading-whitespace id corruption some
// CLOUDFLARE_MODELS entries carry (see cloudflare-models.ts) — matching on
// label instead of id would be more fragile since ids are stable identifiers.
const VEO_3_1 = VIDEO_MODELS.find((m) => m.id.trim() === "google/veo-3.1");
const RECRAFT_4_1 = IMAGE_MODELS.find((m) => m.id.trim() === "recraft/recraftv4-1");
const HERO_VIDEO = SHOWCASE_VIDEOS.find((v) => v.id === "cinematic-scene") ?? SHOWCASE_VIDEOS[0];
const HERO_IMAGE = NANO_BANANA_IMAGES.find((i) => i.id === "vaporwave-poster") ?? NANO_BANANA_IMAGES[0];

// Real, verified example outputs from each model's own fal.ai playground
// page (curl-verified 200 OK on 2026-08-23) — one per additional model, same
// sourcing standard as SHOWCASE_VIDEOS / NANO_BANANA_IMAGES.
const VEO_3_1_VIDEO_URL = "https://v3.fal.media/files/penguin/D-wlVxx1E8BPr2AG9cxhb_output.mp4";
const VEO_3_1_PROMPT =
  "First-person view soaring low over a medieval battlefield at dawn, gliding past clashing knights in armor, fire-lit arrows whizzing overhead, splintered catapults burning near fallen soldiers, flying inches above torn flags and mud-soaked ground, ambient sounds of swords striking, war cries, galloping hooves, and wind rushing in your ears, raw, terrifying, epic";
const RECRAFT_4_1_IMAGE_URL = "https://v3b.fal.media/files/b/0a9a2a9f/s5xQCa912mB4YWFRl3ggv_image.webp";
const RECRAFT_4_1_PROMPT = "High-end skincare bottle floating on a swirl of cream texture, macro, soft pink palette";

type ModelCard = {
  kind: "video" | "image";
  href: string;
  label: string;
  provider: string;
  description: string;
  mediaUrl: string;
};

const MODEL_CARDS: ModelCard[] = [
  SEEDANCE_2 && {
    kind: "video",
    href: `/generate?model=${encodeURIComponent(SEEDANCE_2.id)}&prompt=${encodeURIComponent(HERO_VIDEO.prompt)}`,
    label: SEEDANCE_2.label,
    provider: SEEDANCE_2.provider,
    description: SEEDANCE_2.description,
    mediaUrl: HERO_VIDEO.url,
  },
  NANO_BANANA && {
    kind: "image",
    href: `/generate/image?model=${encodeURIComponent(NANO_BANANA.id)}&prompt=${encodeURIComponent(HERO_IMAGE.prompt)}`,
    label: NANO_BANANA.label,
    provider: NANO_BANANA.provider,
    description: NANO_BANANA.description,
    mediaUrl: HERO_IMAGE.url,
  },
  VEO_3_1 && {
    kind: "video",
    href: `/generate?model=${encodeURIComponent(VEO_3_1.id)}&prompt=${encodeURIComponent(VEO_3_1_PROMPT)}`,
    label: VEO_3_1.label,
    provider: VEO_3_1.provider,
    description: VEO_3_1.description,
    mediaUrl: VEO_3_1_VIDEO_URL,
  },
  RECRAFT_4_1 && {
    kind: "image",
    href: `/generate/image?model=${encodeURIComponent(RECRAFT_4_1.id)}&prompt=${encodeURIComponent(RECRAFT_4_1_PROMPT)}`,
    label: RECRAFT_4_1.label,
    provider: RECRAFT_4_1.provider,
    description: RECRAFT_4_1.description,
    mediaUrl: RECRAFT_4_1_IMAGE_URL,
  },
].filter((c): c is ModelCard => Boolean(c));

// Cards below the hero are off-screen on first paint (some horizontally,
// past the carousel's visible width; the rest vertically, until scrolled
// to) — autoplaying every one of them unconditionally on mount meant every
// landing pageload was fetching/decoding this many video streams at once
// regardless of whether they were ever seen. Deferred to useLazyVideo so
// each only starts once it's actually about to be on screen.
function CarouselVideo({ src }: { src: string }) {
  const { containerRef, videoRef, hasLoadedOnce } = useLazyVideo<HTMLDivElement>();
  return (
    <div ref={containerRef} className="absolute inset-0">
      {hasLoadedOnce && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

// Large feature-card carousel, one per live model with curated examples —
// mirrors higgsfield.ai's horizontal model-carousel pattern: big media
// preview, title/description scrim, single "Open" CTA per card.
export function ModelCarousel() {
  if (MODEL_CARDS.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
      {MODEL_CARDS.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="group relative flex h-[320px] w-[85vw] max-w-sm flex-none snap-center overflow-hidden rounded-2xl border border-line bg-surface-2 sm:h-[380px] sm:w-[480px] sm:max-w-none"
        >
          {card.kind === "video" ? (
            <CarouselVideo src={card.mediaUrl} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai CDN thumbnail, no next/image domain config for this host
            <img
              src={card.mediaUrl}
              alt={card.label}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 0.92) 0%, rgb(0 0 0 / 0.35) 45%, transparent 75%)",
            }}
          />

          <div className="relative z-10 mt-auto flex w-full flex-col gap-2 p-6">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[11px] leading-4 font-medium text-white/80 backdrop-blur">
              {card.provider}
            </span>
            <h3 className="text-heading font-bold text-white">{card.label}</h3>
            <p className="line-clamp-2 text-body-sm text-white/70">{card.description}</p>
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-label font-semibold text-white shadow-glow-sm transition-transform duration-200 group-hover:translate-x-0.5">
              Open workspace
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
