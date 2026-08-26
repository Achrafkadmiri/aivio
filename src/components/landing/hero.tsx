"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroDemoWidget } from "./hero-demo-widget";
import { GradientGlow } from "@/components/marketing/gradient-glow";
import { Marquee } from "@/components/marketing/marquee";
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
// showcase-tabs.tsx): a film-reel strip of real output is the hero's whole
// visual identity here, not a decorative aside — mostly static frames (6
// real GPT Image 2 stills) plus a single looping clip, never a wall of
// simultaneous autoplaying video.
const REEL_VIDEO = SEEDANCE25_SHOWCASE_VIDEOS.find((v) => v.id === "anime-breathing-clash")!;
const REEL_IMAGE_IDS = [
  "hero",
  "photorealism",
  "90s-hallway-portrait",
  "pc-cafe-candid",
  "product-photography",
  "text-rendering",
];
const REEL_IMAGES = REEL_IMAGE_IDS.map((id) => GPT_IMAGE_2_IMAGES.find((i) => i.id === id)!);

function ReelFrame({
  kind,
  src,
  alt,
  label,
}: {
  kind: "video" | "image";
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-surface-2">
      {kind === "video" ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote fal.ai/jxp CDN thumbnail, no next/image domain config for these hosts
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] leading-4 font-medium text-white/80 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

// No boxed "card" for the hero's proof — a vertical film-reel strip bleeds
// off the right edge of the viewport instead, breaking out of container-page
// the way the centered-card-on-a-blob template never does. Text stays
// left-aligned in its own column rather than centered over/beside a
// decorative blob, so the whole composition reads as an asymmetric editorial
// layout instead of the badge → headline → CTA stack most AI-tool landers
// default to.
export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-black">
      <GradientGlow variant="hero" />
      <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex flex-col lg:min-h-[760px] lg:flex-row lg:items-stretch">
        {/* Text column — a real-world left margin (not container-page, which
            would cap this row's width and keep the reel from truly reaching
            the viewport edge), capped so it never runs unreasonably wide on
            ultra-wide monitors. */}
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pt-28 pb-16 text-center sm:px-5 sm:pt-32 lg:mx-0 lg:max-w-none lg:pl-8 lg:pr-12 lg:pt-0 lg:pb-0 lg:text-left xl:pl-12">
          <motion.span
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-caption tracking-widest text-brand uppercase"
          >
            {"// Cinematic-grade AI video generation"}
          </motion.span>

          <motion.h1
            variants={shouldReduceMotion ? undefined : heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="font-display mt-5 text-4xl leading-[0.95] font-bold tracking-tight text-white uppercase sm:text-5xl md:text-6xl lg:text-display"
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
        </div>

        {/* Film-reel strip — full-bleed to the viewport's right edge, real
            output scrolling past like an actual reel instead of sitting in
            a card. Hidden below lg: a strip needs real height to read as a
            reel rather than a cramped thumbnail row. */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative hidden w-full shrink-0 lg:block lg:h-[760px] lg:w-[34%] xl:w-[30%]"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent"
            aria-hidden="true"
          />
          {/* Marquee's vertical track sizes itself to its (looping, so
              effectively infinite) content — without a definite height here
              to clip against, overflow-hidden has nothing to constrain and
              the column grows to the track's full stacked height instead of
              acting as a fixed-height window onto it. */}
          <Marquee direction="vertical" className="h-full py-6 pr-6">
            <ReelFrame kind="video" src={REEL_VIDEO.url} alt={REEL_VIDEO.prompt} label="Seedance 2.5" />
            {REEL_IMAGES.map((img) => (
              <ReelFrame key={img.id} kind="image" src={img.url} alt={img.prompt} label="GPT Image 2" />
            ))}
          </Marquee>
        </motion.div>
      </div>

      <div className="container-page relative pb-20 lg:pb-28">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
        >
          <HeroDemoWidget />
        </motion.div>
      </div>
    </section>
  );
}
