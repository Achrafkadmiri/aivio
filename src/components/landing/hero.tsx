"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { HeroDemoWidget } from "./hero-demo-widget";
import { buttonVariants } from "@/components/ui/button";
import { SEEDANCE25_SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { heroContainerVariants, heroWordVariants } from "@/lib/animations";

// Bold grotesk statement + a short italic-serif line underneath — the same
// two-beat structure ArtCraft uses for "Controllable AI / for artists.":
// one all-caps declarative line the eye reads first, then a quieter,
// lowercase editorial line that reads more like a considered subhead than
// another shouted headline.
const TITLE_WORDS = ["THE", "AI", "VIDEO", "& IMAGE"];
const TITLE_ACCENT_WORD = "STUDIO";
const TITLE_SCRIPT_LINE = "for ambitious creators.";
const CAPABILITIES = ["Text to Video", "Image to Video", "Text to Image", "Plain-language editing"];

// Full-bleed real video background — the migration brief's hero pattern
// (mindvideo.ai: full-screen bg video, centered copy, two glass CTAs)
// replaces the asymmetric film-reel version built earlier in this project's
// history. Still exactly one real clip, still the same honesty standard as
// the rest of the page (see showcase-media.ts) — just framed differently.
const BG_VIDEO = SEEDANCE25_SHOWCASE_VIDEOS.find((v) => v.id === "anime-breathing-clash")!;

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={BG_VIDEO.url} type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[70%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/20 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-page relative py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-caption tracking-widest text-brand uppercase"
          >
            {"// Cinematic-grade AI video & image generation"}
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
            className="mx-auto mt-6 max-w-xl text-body-lg text-muted"
          >
            Describe a scene, animate a photo, or edit an existing shot. Vixerra
            generates and refines broadcast-ready video and imagery in minutes —
            no crew, no timeline, no waiting.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {CAPABILITIES.map((capability) => (
              <span
                key={capability}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-caption text-white/70"
              >
                {capability}
              </span>
            ))}
          </motion.div>

          {/* Two glass CTAs side by side — the migration brief's signature
              hero pattern — instead of one solid pill + a text link. Both
              still route to the same real destinations. */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className={buttonVariants({ variant: "glass", className: "w-full px-7 sm:w-auto" })}
            >
              Start creating free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="#showcase"
              className={buttonVariants({ variant: "glass", className: "w-full px-7 sm:w-auto" })}
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

        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
        >
          <HeroDemoWidget />
        </motion.div>
      </div>

      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-white/40"
          aria-hidden="true"
        >
          <span className="text-caption tracking-wide uppercase">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="size-4" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
