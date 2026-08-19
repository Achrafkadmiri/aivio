import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-surface shadow-glow-sm">
        <Clapperboard className="size-4.5" aria-hidden="true" />
      </span>
      <span className="text-gradient text-feature-title font-bold tracking-tight">Aivio</span>
    </Link>
  );
}
