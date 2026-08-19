import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ComposerShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // Solid bg-surface-2 (not translucent) — this floats over page
        // content now, so it needs to read as an opaque bar, not glass.
        "rounded-xl border border-line bg-surface-2 shadow-floating p-3 sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
