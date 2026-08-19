"use client";

import { cn } from "@/lib/utils";

export type ReferenceMode = "reference" | "keyframe";

export function ReferenceKeyframeTabs({
  value,
  onChange,
}: {
  value: ReferenceMode;
  onChange: (mode: ReferenceMode) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-3 p-1">
      <button
        type="button"
        onClick={() => onChange("reference")}
        className={cn(
          "rounded-full px-3 py-1 text-label font-medium transition-colors",
          value === "reference" ? "bg-ink text-surface" : "text-muted hover:text-ink-soft",
        )}
      >
        Reference
      </button>
      <button
        type="button"
        disabled
        title="Coming soon — keyframe-based conditioning isn't wired up yet."
        className="rounded-full px-3 py-1 text-label font-medium text-muted opacity-50"
      >
        Keyframe
      </button>
    </div>
  );
}
