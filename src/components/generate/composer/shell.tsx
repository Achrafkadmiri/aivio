import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ComposerShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // Solid bg-surface-2 (not translucent) — this floats over page
        // content now, so it needs to read as an opaque bar, not glass.
        // The 1px gradient top edge (::before) is the one accent touch,
        // signalling "this is the generate action" without going full glow.
        "relative isolate overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-floating p-3 sm:p-4",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[image:var(--gradient-primary)] before:content-['']",
        className,
      )}
    >
      {children}
    </div>
  );
}
