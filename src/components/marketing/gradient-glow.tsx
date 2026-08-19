import { cn } from "@/lib/utils";

/**
 * Decorative, blurred gradient orbs using the existing brand tokens —
 * purely visual depth behind a section. Pure CSS (transform-only keyframe,
 * GPU-cheap), gated by motion-safe: so reduced-motion users get a static
 * glow instead of the float animation.
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
      <div className="absolute -top-32 left-1/4 size-[32rem] rounded-full bg-brand/15 blur-[110px] motion-safe:animate-glow-float" />
      <div
        className="absolute top-1/3 -right-24 size-[26rem] rounded-full bg-white/[0.04] blur-[110px] motion-safe:animate-glow-float"
        style={{ animationDelay: "-6s" }}
      />
      {variant === "hero" && (
        <div
          className="absolute bottom-0 left-1/3 size-[22rem] rounded-full bg-brand/10 blur-[110px] motion-safe:animate-glow-float"
          style={{ animationDelay: "-11s" }}
        />
      )}
    </div>
  );
}
