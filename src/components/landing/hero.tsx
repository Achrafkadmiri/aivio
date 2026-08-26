"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroDemoWidget } from "./hero-demo-widget";
import { GradientGlow } from "@/components/marketing/gradient-glow";
import { TiltCard } from "@/components/marketing/tilt-card";
import { SEEDANCE25_SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { GPT_IMAGE_2_IMAGES } from "@/lib/gpt-image-2-showcase";
import { heroContainerVariants, heroWordVariants } from "@/lib/animations";

// Bold grotesk statement + a short italic-serif line underneath — the same
// two-beat structure ArtCraft uses for "Controllable AI / for artists.":
// one all-caps declarative line the eye reads first, then a quieter,
// lowercase editorial line that reads more like a considered subhead than
// another shouted headline.
const TITLE_WORDS = ["THE", "AI", "VIDEO"];
const TITLE_ACCENT_WORD = "GENERATOR";
const TITLE_SCRIPT_LINE = "for ambitious creators.";

// One deliberate exception to "media only in the Showcase section" (see
// showcase-tabs.tsx): a small, real proof collage right in the hero reads as
// dramatically more convincing — and less like a templated AI-SaaS page —
// than another abstract headline-over-gradient-blob composition. Kept to
// exactly 3 real, already-verified assets (1 video + 2 images, same sourcing
// standard as the Showcase section) rather than reopening the autoplay-video
// sprawl that was deliberately removed everywhere else on this page.
const COLLAGE_VIDEO = SEEDANCE25_SHOWCASE_VIDEOS.find((v) => v.id === "anime-breathing-clash")!;
const COLLAGE_IMAGE_BACK = GPT_IMAGE_2_IMAGES.find((i) => i.id === "pc-cafe-candid")!;
const COLLAGE_IMAGE_FRONT = GPT_IMAGE_2_IMAGES.find((i) => i.id === "photorealism")!;

function CollageCard({
  className,
  rotate,
  float,
  delay = 0,
  label,
  children,
}: {
  className: string;
  rotate: number;
  float: number;
  delay?: number;
  label: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24, rotate: 0 }}
      animate={{
        opacity: 1,
        rotate,
        y: shouldReduceMotion ? 0 : [0, -float, 0],
      }}
      transition={{
        opacity: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
        rotate: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
        y: shouldReduceMotion
          ? undefined
          : { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <TiltCard>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-floating">
          {children}
          <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] leading-4 font-medium text-white/85 backdrop-blur">
            {label}
          </span>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// No full-bleed background video here — the landing page's video/image
// content is otherwise kept to the one section built to showcase it
// (ModelCarousel + ShowcaseTabs, under "See it in action"); this hero's own
// collage is the single deliberate exception, not a return to the old
// autoplaying-everywhere pattern.
export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-black">
      <GradientGlow variant="hero" />
      <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="container-page relative pt-28 pb-20 sm:pt-32 lg:pt-40 lg:pb-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          {/* Text column — left-aligned on desktop instead of the centered
              stack every other AI-video landing page defaults to. */}
          <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] leading-4 font-semibold tracking-wide text-brand uppercase lg:mx-0">
                New — cinematic-grade AI video generation
              </span>
            </motion.div>

            <motion.h1
              variants={shouldReduceMotion ? undefined : heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="font-display mt-6 text-4xl leading-[0.95] font-bold tracking-tight text-white uppercase sm:text-5xl md:text-6xl lg:text-display"
            >
              {TITLE_WORDS.map((word, i) => (
                <motion.span
                  key={`w-${i}`}
                  variants={shouldReduceMotion ? undefined : heroWordVariants}
                  className="mr-[0.25em] inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                variants={shouldReduceMotion ? undefined : heroWordVariants}
                className="inline-block text-brand"
              >
                {TITLE_ACCENT_WORD}
              </motion.span>
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="text-accent-script mt-2 text-3xl text-white/90 sm:text-4xl md:text-5xl"
            >
              {TITLE_SCRIPT_LINE}
            </motion.p>

            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-body-lg text-muted lg:mx-0"
            >
              Describe a scene, animate a photo, or drop in audio. Vixerra generates
              broadcast-ready video and imagery in minutes — no crew, no timeline,
              no waiting.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link
                href="/signup"
                className="font-display inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-label font-semibold text-black transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:px-6 sm:py-3"
              >
                Start creating free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="#showcase"
                className="text-label font-medium text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
              >
                See examples
              </Link>
            </motion.div>

            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1 }}
              className="mt-4 text-caption text-white/50"
            >
              50 free credits to start — no credit card required
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
            >
              <HeroDemoWidget />
            </motion.div>
          </div>

          {/* Proof collage — real output, tilted and layered like a
              scattered print pile instead of a stock-photo hero shot. Hidden
              below lg: three overlapping cards need real width to read as
              intentional rather than cramped. */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block lg:h-[560px]">
            <CollageCard
              className="absolute top-0 right-2 z-10 w-[56%]"
              rotate={7}
              float={10}
              delay={0.2}
              label="GPT Image 2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/jxp CDN thumbnail, no next/image domain config for these hosts */}
              <img
                src={COLLAGE_IMAGE_BACK.url}
                alt={COLLAGE_IMAGE_BACK.prompt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </CollageCard>

            <CollageCard
              className="absolute bottom-2 left-0 z-10 w-[54%]"
              rotate={-9}
              float={12}
              delay={0.35}
              label="GPT Image 2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/jxp CDN thumbnail, no next/image domain config for these hosts */}
              <img
                src={COLLAGE_IMAGE_FRONT.url}
                alt={COLLAGE_IMAGE_FRONT.prompt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </CollageCard>

            <CollageCard
              className="absolute top-1/2 left-1/2 z-20 w-[62%] -translate-x-1/2 -translate-y-1/2"
              rotate={-3}
              float={14}
              delay={0.5}
              label="Seedance 2.5"
            >
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              >
                <source src={COLLAGE_VIDEO.url} type="video/mp4" />
              </video>
            </CollageCard>
          </div>
        </div>
      </div>
    </section>
  );
}
