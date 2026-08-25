"use client";

import { motion } from "framer-motion";
import { Video, Image as ImageIcon, Sparkles, Wand2, Layers, Users, Zap } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { gridContainerVariants, gridItemVariants } from "@/lib/animations";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { NANO_BANANA_IMAGES } from "@/lib/nano-banana-showcase";
import { useLazyVideo } from "@/hooks/use-lazy-video";
import { cn } from "@/lib/utils";

// "AI [video] generator features that go beyond the basics" — leonardo.ai's
// own Create/Refine/Scale features section (separate from their linear
// "How it works" steps — this used to be merged into how-it-works.tsx here,
// now split to match their real page structure). Populated with real Vixerra
// features only — the reference site's own example invents a couple of
// items (Background Removal, Upscale) that don't exist in this app; these
// are swapped for real equivalents (AI prompt enhancement, reference-guided
// control, priority queue & API access).
// Each group gets one representative sample (video for Create, images for
// Refine/Scale) shown beside its item list — distinct assets from every
// other section on this page (never the same clip/image reused twice on
// one load).
const GROUPS = [
  {
    label: "Create",
    media: { kind: "video", ...SHOWCASE_VIDEOS.find((v) => v.id === "parrot-jungle")! },
    items: [
      { icon: Sparkles, title: "Text to Image", body: "Generate stills from a written prompt." },
      { icon: Video, title: "Text to Video", body: "Describe a shot and generate motion from scratch." },
      { icon: ImageIcon, title: "Image to Video", body: "Animate a still photo into a moving clip." },
    ],
  },
  {
    label: "Refine",
    media: { kind: "image", ...NANO_BANANA_IMAGES.find((i) => i.id === "coastline-edit-after")! },
    items: [
      { icon: Wand2, title: "Plain-language editing", body: "Describe the change you want — no masks, no region selection." },
      { icon: Sparkles, title: "AI prompt enhancement", body: "Turn a rough idea into a detailed, model-ready prompt in one click." },
      { icon: Layers, title: "Reference-guided control", body: "Guide composition and camera with reference shots on supported models." },
    ],
  },
  {
    label: "Scale",
    media: { kind: "image", ...NANO_BANANA_IMAGES.find((i) => i.id === "character-consistency-2")! },
    items: [
      { icon: Users, title: "Consistent characters", body: "The same character keeps its identity across multiple generations." },
      { icon: Zap, title: "Priority queue & API", body: "Faster generation and programmatic access on Pro and above." },
    ],
  },
] as const;

function GroupMedia({ media, className }: { media: (typeof GROUPS)[number]["media"]; className?: string }) {
  // Runs unconditionally (image groups just never read hasLoadedOnce) so the
  // hook order stays stable across renders regardless of media.kind.
  const { containerRef, videoRef, hasLoadedOnce } = useLazyVideo<HTMLDivElement>();

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card lg:aspect-auto lg:h-full",
        className,
      )}
    >
      {media.kind === "video" ? (
        hasLoadedOnce && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          >
            <source src={media.url} type="video/mp4" />
          </video>
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/ghost CDN thumbnails, no next/image domain config for these hosts
        <img src={media.url} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Reveal className="container-page mx-auto max-w-2xl text-center">
        <h2 className="text-heading font-bold text-ink">
          Features that go beyond the basics
        </h2>
        <p className="mt-4 text-body text-muted">
          Vixerra&apos;s AI tools help creators move from idea to finished shot without losing
          quality or control.
        </p>
      </Reveal>

      <div className="mt-16">
        {GROUPS.map((group, i) => (
          <div
            key={group.label}
            className={`border-t border-line py-14 first:border-t-0 ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}
          >
            <div className="container-page grid gap-8 lg:grid-cols-5 lg:items-stretch lg:gap-10">
              <GroupMedia
                media={group.media}
                className={cn("lg:col-span-2", i % 2 === 1 ? "lg:order-last" : "lg:order-first")}
              />

              <div className="lg:order-none lg:col-span-3">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-caption tracking-widest text-brand uppercase"
                >
                  {group.label}
                </motion.span>

                <motion.div
                  variants={gridContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  className="mt-6 space-y-4"
                >
                  {group.items.map((item) => (
                    <motion.div
                      key={item.title}
                      variants={gridItemVariants}
                      className="flex items-start gap-4 rounded-2xl border border-border-subtle bg-surface-2 p-6"
                    >
                      <span className="flex size-10 flex-none items-center justify-center rounded-lg bg-brand/15">
                        <item.icon className="size-5 text-brand" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-feature-title font-semibold text-ink">{item.title}</h3>
                        <p className="mt-2 text-body-sm text-muted">{item.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
