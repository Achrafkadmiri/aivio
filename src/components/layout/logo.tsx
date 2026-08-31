import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-ink", className)}>
      {/* currentColor rather than a hardcoded #fff: the mark sits on a
          solid brand fill, which is a light gold, so the glyph has to be
          the dark on-brand ink — see --color-on-brand in globals.css. */}
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand text-on-brand shadow-glow-sm">
        <svg width="18" height="18" viewBox="-8 -8 116 116" fill="none" aria-hidden="true">
          <rect x="37" y="18" width="26" height="64" rx="7" fill="currentColor" fillOpacity="0.5" transform="rotate(-20, 50, 82)" />
          <rect x="37" y="18" width="26" height="64" rx="7" fill="currentColor" transform="rotate(20, 50, 82)" />
        </svg>
      </span>
      {!iconOnly && (
        <span className="font-display text-feature-title font-bold tracking-tight">
          <span className="text-ink">Vix</span>
          <span className="text-brand">erra</span>
        </span>
      )}
    </Link>
  );
}
