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
        // The shadow layers the standard floating drop with a whisper-soft
        // brand-tinted glow underneath — same restrained "one accent touch"
        // rule, just felt as depth instead of drawn as a shape.
        "relative isolate overflow-hidden rounded-2xl border border-line bg-surface-2 p-3 sm:p-4",
        "shadow-[0_8px_30px_-4px_rgb(0_0_0_/_0.5),0_0_60px_-24px_rgb(255_77_35_/_0.35)]",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-brand before:content-['']",
        className,
      )}
    >
      {children}
    </div>
  );
}
