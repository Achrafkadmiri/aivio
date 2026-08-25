"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Backs every "don't load this video until it's about to be on screen" spot
 * on the landing page (showcase tiles, feature/capability media, ...).
 * Nothing is fetched until the container gets within 80px of the viewport
 * (IntersectionObserver rootMargin) — the <video> itself should only be
 * mounted once that's happened (see `hasLoadedOnce`), not rendered
 * unconditionally with a `hidden`-style class, since the browser starts
 * fetching a <video>'s <source> the moment it's in the DOM regardless of
 * CSS visibility. Playback pauses whenever it scrolls back out of view, but
 * the element stays mounted once loaded — no re-fetch from scrolling past
 * it a second time.
 *
 * Margin is kept tight (rather than e.g. 200px) so a dense grid of many
 * tiles (showcase-tabs' masonry, features-showcase's groups) doesn't cross
 * the threshold all at once and fire a burst of simultaneous video fetches
 * the moment that section nears the viewport — the whole point of lazy
 * loading is defeated if "lazy" still means "a dozen at a time".
 *
 * Single shared implementation for every video tile on the page (showcase
 * grid, model carousel, capability/feature cards, how-it-works result,
 * stats strip, CTA section) so this tuning only needs to happen in one place.
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
      { rootMargin: "80px" },
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
