"use client";

import { motion } from "framer-motion";
import { Video, Image as ImageIcon, Sparkles, Wand2, Layers, Users, Zap } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { gridContainerVariants, gridItemVariants } from "@/lib/animations";

// "AI [video] generator features that go beyond the basics" — leonardo.ai's
// own Create/Refine/Scale features section (separate from their linear
// "How it works" steps — this used to be merged into how-it-works.tsx here,
// now split to match their real page structure). Populated with real Aivio
// features only — the reference site's own example invents a couple of
// items (Background Removal, Upscale) that don't exist in this app; these
// are swapped for real equivalents (AI prompt enhancement, reference-guided
// control, priority queue & API access).
const GROUPS = [
  {
    label: "Create",
    items: [
      { icon: Sparkles, title: "Text to Image", body: "Generate stills from a written prompt." },
      { icon: Video, title: "Text to Video", body: "Describe a shot and generate motion from scratch." },
      { icon: ImageIcon, title: "Image to Video", body: "Animate a still photo into a moving clip." },
    ],
  },
  {
    label: "Refine",
    items: [
      { icon: Wand2, title: "Plain-language editing", body: "Describe the change you want — no masks, no region selection." },
      { icon: Sparkles, title: "AI prompt enhancement", body: "Turn a rough idea into a detailed, model-ready prompt in one click." },
      { icon: Layers, title: "Reference-guided control", body: "Guide composition and camera with reference shots on supported models." },
    ],
  },
  {
    label: "Scale",
    items: [
      { icon: Users, title: "Consistent characters", body: "The same character keeps its identity across multiple generations." },
      { icon: Zap, title: "Priority queue & API", body: "Faster generation and programmatic access on Pro and above." },
    ],
  },
] as const;

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Reveal className="container-page mx-auto max-w-2xl text-center">
        <h2 className="text-heading font-bold text-ink">
          Features that go beyond the basics
        </h2>
        <p className="mt-4 text-body text-muted">
          Aivio&apos;s AI tools help creators move from idea to finished shot without losing
          quality or control.
        </p>
      </Reveal>

      <div className="mt-16">
        {GROUPS.map((group, i) => (
          <div
            key={group.label}
            className={`border-t border-line py-14 first:border-t-0 ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}
          >
            <div className="container-page">
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
                className={`mt-6 grid gap-4 sm:grid-cols-2 ${group.items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
              >
                {group.items.map((item) => (
                  <motion.div
                    key={item.title}
                    variants={gridItemVariants}
                    className="rounded-2xl border border-border-subtle bg-surface-2 p-6"
                  >
                    <item.icon className="size-5 text-brand" aria-hidden="true" />
                    <h3 className="mt-4 text-feature-title font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 text-body-sm text-muted">{item.body}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
