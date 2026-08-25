"use client";

/**
 * Backs every "glow that follows the cursor on hover" card (dashboard's
 * credits card, the billing plan card, generate's empty-state canvas).
 * Writes the pointer position into --spot-x/--spot-y as plain inline
 * style properties (not React state) so it stays cheap at mousemove
 * frequency — no re-render per pixel moved. Pair with a blurred solid
 * shape (not a radial-gradient()) positioned from those two variables,
 * same "blur, not gradient()" technique as every other glow in this app
 * (see globals.css) — it just needs a live cursor position instead of a
 * fixed corner.
 */
export function useSpotlight<T extends HTMLElement>() {
  return {
    onMouseMove: (e: React.MouseEvent<T>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    },
  };
}
