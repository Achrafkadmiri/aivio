import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-glow-sm">
        <svg width="18" height="18" viewBox="-8 -8 116 116" fill="none" aria-hidden="true">
          <rect x="37" y="18" width="26" height="64" rx="7" fill="#fff" fillOpacity="0.55" transform="rotate(-20, 50, 82)" />
          <rect x="37" y="18" width="26" height="64" rx="7" fill="#fff" transform="rotate(20, 50, 82)" />
        </svg>
      </span>
      <span className="text-feature-title font-bold uppercase tracking-widest">
        <span className="text-ink">Vix</span>
        <span className="text-brand">erra</span>
      </span>
    </Link>
  );
}
