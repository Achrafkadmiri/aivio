import { cn } from "@/lib/utils";

/**
 * Decorative, blurred gradient blobs using the existing brand tokens —
 * purely visual depth behind a section. Pure CSS (transform + border-radius
 * keyframe, GPU-cheap enough at this blur radius), gated by motion-safe: so
 * reduced-motion users get a static organic shape instead of the drift/
 * morph animation. Deliberately not rounded-full circles — the blob-float
 * keyframe drifts each shape's corners over time so these read as liquid
 * forms, not blurred discs, which is most of what makes a page feel
 * "fluid" rather than templated. One ember + one teal blob per instance
 * (was two identical brand-tinted circles) so the pair reads as the same
 * warm/cool brand pair used everywhere else, not a single glow repeated.
 */
export function GradientGlow({
  className,
  variant = "section",
}: {
  className?: string;
  variant?: "hero" | "section";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-32 left-1/4 size-[32rem] bg-brand/15 blur-[110px] motion-safe:animate-blob-float" />
      <div
        className="absolute top-1/3 -right-24 size-[26rem] bg-accent-teal/10 blur-[110px] motion-safe:animate-blob-float"
        style={{ animationDelay: "-6s" }}
      />
      {variant === "hero" && (
        <div
          className="absolute bottom-0 left-1/3 size-[22rem] bg-brand/10 blur-[110px] motion-safe:animate-blob-float"
          style={{ animationDelay: "-11s" }}
        />
      )}
    </div>
  );
}
