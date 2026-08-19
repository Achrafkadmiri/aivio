"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Doubles as the form's submit control — the credit cost IS the call to action. */
export function CreditsSubmitPill({
  credits,
  loading,
  disabled,
  className,
}: {
  credits: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      title={`Generate — costs ~${credits} credit${credits === 1 ? "" : "s"}`}
      aria-label="Generate"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-label font-semibold text-surface",
        "transition-transform hover:-translate-y-px active:translate-y-0",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="size-4" aria-hidden="true" />
      )}
      {credits}
    </button>
  );
}
