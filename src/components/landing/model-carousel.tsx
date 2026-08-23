"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { NANO_BANANA_IMAGES } from "@/lib/nano-banana-showcase";
import { VIDEO_MODELS, IMAGE_MODELS, SEEDANCE2_MODEL_ID } from "@/lib/constants";

const SEEDANCE_2 = VIDEO_MODELS.find((m) => m.id === SEEDANCE2_MODEL_ID);
const NANO_BANANA = IMAGE_MODELS.find((m) => m.label === "Nano Banana 2 Lite");
const HERO_VIDEO = SHOWCASE_VIDEOS.find((v) => v.id === "cinematic-scene") ?? SHOWCASE_VIDEOS[0];
const HERO_IMAGE = NANO_BANANA_IMAGES.find((i) => i.id === "vaporwave-poster") ?? NANO_BANANA_IMAGES[0];

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
].filter((c): c is ModelCard => Boolean(c));

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
            <video
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src={card.mediaUrl} type="video/mp4" />
            </video>
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
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[image:var(--gradient-primary)] px-4 py-2 text-label font-semibold text-white shadow-glow-sm transition-transform duration-200 group-hover:translate-x-0.5">
              Open workspace
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
