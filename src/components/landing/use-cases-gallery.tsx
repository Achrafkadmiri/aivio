"use client";

import { motion } from "framer-motion";
import { NANO_BANANA_IMAGES } from "@/lib/nano-banana-showcase";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

// Masonry gallery (design system §6.5) — every real Nano Banana example in
// the showcase pool, hover reveals the actual prompt that produced it.
// Alternating rotation (in degrees, driven through Framer Motion rather
// than a Tailwind rotate-* class — the tile is already animated with `y`
// via whileInView, and a CSS class touching `transform` would just get
// clobbered by Framer's own inline transform) + vertical offset margin
// gives it a scattered-print-pile feel instead of a flat aligned masonry.
// Straightens out on hover.
const ROTATIONS = [-2, 2, 1, -1, 2, -2, 1];
const OFFSETS = ["mt-0", "mt-6", "mt-2", "mt-8", "mt-0", "mt-4", "mt-6"];

export function UseCasesGallery() {
  return (
    <section className="border-t border-line bg-surface-2/30 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-bold text-ink">A closer look</h2>
          <p className="mt-4 text-body text-muted">
            Real output from Nano Banana, one of the image models built into Aivio. Hover to see
            the prompt.
          </p>
        </Reveal>

        <div className="mt-16 columns-2 gap-4 md:columns-3 lg:columns-4">
          {NANO_BANANA_IMAGES.map((image, i) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: ROTATIONS[i % ROTATIONS.length] }}
              whileHover={{ rotate: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: (i % 4) * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "group relative mb-4 break-inside-avoid overflow-hidden rounded-xl hover:z-10",
                OFFSETS[i % OFFSETS.length],
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked
                  third-party showcase image; see nano-banana-showcase.ts */}
              <img
                src={image.url}
                alt={image.prompt}
                loading="lazy"
                className="w-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute right-4 bottom-4 left-4">
                  <p className="line-clamp-3 text-caption text-white/85">{image.prompt}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
