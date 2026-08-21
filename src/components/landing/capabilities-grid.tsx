"use client";

import { motion } from "framer-motion";
import { gridContainerVariants, gridItemVariants } from "@/lib/animations";
import { getNanoBananaImage } from "@/lib/nano-banana-showcase";
import { cn } from "@/lib/utils";

// "Why creatives choose Vixerra" — leonardo.ai's real section has four cards;
// each here is backed by an actual Nano Banana example output rather than
// an icon or invented stat.
const REASONS = [
  {
    title: "From idea to execution",
    body: "A single prompt becomes a fully realized, photoreal shot — natural lighting, fine detail, real motion.",
    image: getNanoBananaImage("dog-pool-action"),
  },
  {
    title: "Diverse styles",
    body: "Photoreal one moment, illustrated poster art the next — the same model adapts to the brief.",
    image: getNanoBananaImage("vaporwave-poster"),
  },
  {
    title: "Consistency & control",
    body: "The same character keeps its identity across multiple generated scenes.",
    image: getNanoBananaImage("character-consistency-1"),
  },
  {
    title: "Built for real work",
    body: "Sharp text, clean detail, and edits that hold up in production — not just nice-looking demos.",
    image: getNanoBananaImage("text-rendering"),
  },
] as const;

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

      {/* Alternating vertical offset ("brick" stagger) instead of a flat
          uniform grid — every card sits at the same row-start by default,
          odd cards ride lower, so the row reads as a wave rather than a
          spreadsheet. */}
      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mt-16 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {REASONS.map((reason, i) => (
          <motion.div
            key={reason.title}
            variants={gridItemVariants}
            className={cn("group", i % 2 === 1 && "sm:mt-12 lg:mt-16")}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-2xl bg-surface-2",
                i % 2 === 1 ? "aspect-square" : "aspect-[4/5]",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked
                  third-party showcase image; see nano-banana-showcase.ts */}
              <img
                src={reason.image.url}
                alt={reason.image.prompt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <h3 className="mt-5 text-feature-title font-semibold text-ink">{reason.title}</h3>
            <p className="mt-2 text-body-sm text-muted">{reason.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
