"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroDemoWidget } from "./hero-demo-widget";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { heroContainerVariants, heroWordVariants } from "@/lib/animations";

// Two-tone split mirroring leonardo.ai's own hero headline structure
// ("THE AI IMAGE GENERATOR FOR AMBITIOUS CREATIVES") — adapted to what
// Vixerra actually does (video-first, not image-first).
const TITLE_WORDS_WHITE = ["THE", "AI", "VIDEO"];
const TITLE_WORDS_ACCENT = ["GENERATOR", "FOR", "AMBITIOUS", "CREATORS"];

export function Hero() {
  const bgVideo = SHOWCASE_VIDEOS.find((v) => v.id === "cinematic-scene") ?? SHOWCASE_VIDEOS[0];
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 120]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, shouldReduceMotion ? 1 : 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, shouldReduceMotion ? 1 : 0]);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-black">
      <motion.video
        className="absolute inset-0 h-full w-full object-cover"
        style={{ y: videoY, scale: videoScale }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={bgVideo.url} type="video/mp4" />
      </motion.video>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(110 96 238 / 0.25) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black"
        aria-hidden="true"
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-page relative pt-24 pb-24 sm:pt-32 sm:pb-32 lg:pt-40 lg:pb-40"
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#1df072]/30 bg-[#1df072]/10 px-3 py-1 text-[11px] leading-4 font-semibold tracking-wide text-[#1df072] uppercase">
              New — cinematic-grade AI video generation
            </span>
          </motion.div>

          <motion.h1
            variants={shouldReduceMotion ? undefined : heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="mt-6 text-4xl leading-[0.95] font-black tracking-tight text-white uppercase sm:text-5xl md:text-6xl lg:text-display"
          >
            {TITLE_WORDS_WHITE.map((word, i) => (
              <motion.span
                key={`w-${i}`}
                variants={shouldReduceMotion ? undefined : heroWordVariants}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
            {TITLE_WORDS_ACCENT.map((word, i) => (
              <motion.span
                key={`a-${i}`}
                variants={shouldReduceMotion ? undefined : heroWordVariants}
                className="mr-[0.25em] inline-block text-[#1df072]"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-body-lg text-muted"
          >
            Describe a scene, animate a photo, or drop in audio. Vixerra generates
            broadcast-ready video and imagery in minutes — no crew, no timeline,
            no waiting.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-label font-semibold text-black transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:px-6 sm:py-3"
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
        </div>

        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
        >
          <HeroDemoWidget />
        </motion.div>
      </motion.div>
    </section>
  );
}
