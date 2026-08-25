"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket, Palette, Fingerprint, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { gridContainerVariants, gridItemVariants } from "@/lib/animations";
import { TiltCard } from "@/components/marketing/tilt-card";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { NANO_BANANA_IMAGES } from "@/lib/nano-banana-showcase";
import { cn } from "@/lib/utils";

// Same four-hue solid rotation as features-grid.tsx (ember/teal/amber/rust)
// instead of every icon badge sharing one gradient fill.
const CHIP_COLORS = ["bg-brand", "bg-accent-teal", "bg-brand-soft", "bg-brand-deep"];

// "Why creatives choose Vixerra" — each reason is backed by one real sample
// (a muted autoplay video or a Nano Banana image) instead of a bare icon
// card, so the claim is shown, not just stated. Distinct entries from the
// showcase gallery below (never the same clip/image twice on one page load)
// keep this from reading as a repeat of the gallery.
const REASONS = [
  {
    icon: Rocket,
    title: "From idea to execution",
    body: "A single prompt becomes a fully realized, photoreal shot — natural lighting, fine detail, real motion.",
    media: { kind: "video", ...SHOWCASE_VIDEOS.find((v) => v.id === "falcon-desert")! },
  },
  {
    icon: Palette,
    title: "Diverse styles",
    body: "Photoreal one moment, illustrated poster art the next — the same model adapts to the brief.",
    media: { kind: "image", ...NANO_BANANA_IMAGES.find((i) => i.id === "vaporwave-poster")! },
  },
  {
    icon: Fingerprint,
    title: "Consistency & control",
    body: "The same character keeps its identity across multiple generated scenes.",
    media: { kind: "image", ...NANO_BANANA_IMAGES.find((i) => i.id === "character-consistency-1")! },
  },
  {
    icon: ShieldCheck,
    title: "Built for real work",
    body: "Sharp text, clean detail, and edits that hold up in production — not just nice-looking demos.",
    media: { kind: "image", ...NANO_BANANA_IMAGES.find((i) => i.id === "text-rendering")! },
  },
] as const;

function CardVideo({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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
    if (inView) videoEl.play().catch(() => {});
    else videoEl.pause();
  }, [inView, hasLoadedOnce]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {hasLoadedOnce && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export function CapabilitiesGrid() {
  return (
    <section id="capabilities" className="container-page py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-heading font-bold text-ink">Why creatives choose Vixerra</h2>
        <p className="mt-4 text-body text-muted">
          Most AI tools promise fast results. Vixerra is built for the work that comes after —
          shots you can actually ship.
        </p>
      </motion.div>

      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {REASONS.map((reason, index) => (
          <motion.div key={reason.title} variants={gridItemVariants}>
            <TiltCard className="h-full">
              <div className="relative flex h-full min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card transition-colors duration-300 hover:border-brand/40">
                {reason.media.kind === "video" ? (
                  <CardVideo src={reason.media.url} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/ghost CDN thumbnails, no next/image domain config for these hosts
                  <img
                    src={reason.media.url}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* Bottom-up scrim keeps the title/body legible over any media,
                    plus a light top scrim so the icon badge never sits on a
                    bright frame. */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    "bg-gradient-to-t from-black/90 via-black/55 to-black/10",
                  )}
                  aria-hidden="true"
                />

                <div className="relative flex flex-1 flex-col justify-between p-6">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-glow-sm">
                    <reason.icon className="size-6 text-white" aria-hidden="true" />
                  </span>

                  <div>
                    <h3 className="text-feature-title font-semibold text-white">{reason.title}</h3>
                    <p className="mt-2 text-body-sm text-white/75">{reason.body}</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
