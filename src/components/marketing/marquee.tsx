import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pure-CSS infinite marquee: the track is rendered twice back-to-back and
 * translated by exactly -50%, so it loops seamlessly. No JS, transform-only
 * animation (GPU-cheap), pauses on hover, and collapses to a static row for
 * prefers-reduced-motion.
 */
export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]", className)}>
      <div className="flex w-max motion-safe:animate-marquee motion-safe:group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center gap-3 pr-3">{children}</div>
        <div className="flex shrink-0 items-center gap-3 pr-3" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
