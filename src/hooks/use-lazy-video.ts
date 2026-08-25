"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Backs every "don't load this video until it's about to be on screen" spot
 * on the landing page (showcase tiles, feature/capability media, ...).
 * Nothing is fetched until the container gets within 200px of the viewport
 * (IntersectionObserver rootMargin) — the <video> itself should only be
 * mounted once that's happened (see `hasLoadedOnce`), not rendered
 * unconditionally with a `hidden`-style class, since the browser starts
 * fetching a <video>'s <source> the moment it's in the DOM regardless of
 * CSS visibility. Playback pauses whenever it scrolls back out of view, but
 * the element stays mounted once loaded — no re-fetch from scrolling past
 * it a second time.
 *
 * Was duplicated near-identically in capabilities-grid.tsx, how-it-works.tsx,
 * showcase-tabs.tsx, and features-showcase.tsx; this is that logic pulled
 * out so the same fix could reach model-carousel.tsx, stats-strip.tsx, and
 * cta-section.tsx too, instead of a fifth copy-paste.
 */
export function useLazyVideo<Container extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<Container>(null);
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

  return { containerRef, videoRef, hasLoadedOnce };
}
