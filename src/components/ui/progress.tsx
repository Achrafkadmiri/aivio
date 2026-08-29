import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
  animated = false,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  /** Opt-in "live work in progress" treatment: a sheen sweeping along the
   * fill, a glowing leading edge, and — while the reported value is still 0
   * (queued / just submitted) — an indeterminate segment sliding across the
   * track instead of an empty bar. Off by default so the static meters
   * (credits, plan usage) keep the plain flat fill. */
  animated?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const indeterminate = animated && pct <= 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-line",
        animated && "h-1.5 bg-white/8 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      {indeterminate ? (
        // Short segment travelling the full track — the queued phase has no
        // real percentage to show, and a 0%-wide fill would read as stalled.
        <div
          className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand shadow-glow-sm motion-safe:animate-progress-indeterminate"
          aria-hidden="true"
        />
      ) : (
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-full bg-brand transition-[width] duration-500 ease-out",
            animated && "shadow-glow-sm",
            barClassName,
          )}
          style={{ width: `${pct}%` }}
        >
          {animated ? (
            // Blurred flat-white highlight rather than a gradient fill —
            // this palette has no gradients anywhere (see globals.css).
            <span
              className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/60 blur-[6px] motion-safe:animate-progress-sheen"
              aria-hidden="true"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
