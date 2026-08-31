"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { CREDIT_VALUE_USD } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Doubles as the form's submit control — the credit cost IS the call to
 * action.
 *
 * The button itself only has room for the number, which on its own reads as
 * a mystery figure, so the unit, the money equivalent and the resulting
 * balance live in a tooltip. It's the app's own Tooltip rather than a native
 * `title` for the same reason DisabledPillHint uses one (see pill.tsx):
 * everything else floating in this composer is styled UI, and a browser
 * tooltip in the middle of it isn't.
 */
export function CreditsSubmitPill({
  credits,
  loading,
  disabled,
  balance,
  blockedReason,
  fullWidth,
  className,
}: {
  credits: number;
  loading?: boolean;
  disabled?: boolean;
  /** Current credit balance, when known — used to refuse a generation the
   * user can't pay for before it costs them a round-trip and a 402 toast. */
  balance?: number;
  /** Why this generation can't be submitted as configured (e.g. a resolution
   * above the plan's cap). Shown in place of the cost and blocks submit. */
  blockedReason?: string;
  /** Panel-footer variant: spans its container as a big labeled "Generate"
   * button instead of the compact number-only pill. */
  fullWidth?: boolean;
  className?: string;
}) {
  const unaffordable = balance !== undefined && credits > balance;
  const unit = `credit${credits === 1 ? "" : "s"}`;
  const money = (credits * CREDIT_VALUE_USD).toFixed(2);

  const hint = blockedReason
    ? blockedReason
    : unaffordable
      ? `Not enough credits — this costs ~${credits} ${unit} and you have ${balance}. Top up or upgrade to continue.`
      : balance !== undefined
        ? `Generate — costs ~${credits} ${unit} (≈$${money}), leaving ${balance - credits}.`
        : `Generate — costs ~${credits} ${unit} (≈$${money}).`;

  const blocked = Boolean(blockedReason) || unaffordable;

  return (
    <Tooltip content={hint}>
      {/* A disabled button fires no pointer events, so the tooltip's hover
          target has to be the wrapper — same pattern as DisabledPillHint. */}
      <span className={cn("inline-flex shrink-0", fullWidth && "w-full")} tabIndex={0}>
        <button
          type="submit"
          disabled={disabled || loading || blocked}
          aria-label={hint}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 bg-brand text-label font-semibold text-white shadow-glow-sm",
            fullWidth
              ? "w-full justify-center rounded-xl px-4 py-3"
              : "rounded-full px-3.5 py-2",
            "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:scale-[1.02] hover:shadow-glow-md active:translate-y-0 active:scale-[0.98]",
            "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100",
            className,
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {fullWidth ? (
            <>
              Generate
              <span className="font-normal text-white/80">
                · {credits} {unit}
              </span>
            </>
          ) : (
            credits
          )}
        </button>
      </span>
    </Tooltip>
  );
}
