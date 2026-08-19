import { Zap } from "lucide-react";
import { CreditValue } from "@/components/credit-value";

/**
 * Live "this will cost ~N credits" readout shown above the submit button in
 * every generation form, recomputed from the form's own watched values —
 * see estimateVideoCredits/estimateImageCredits in @/lib/credit-estimate.
 */
export function CreditEstimate({ credits, note }: { credits: number; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
      <span className="flex items-center gap-2 text-body-sm text-muted">
        <Zap className="size-4 text-brand" aria-hidden="true" />
        Estimated cost{note ? ` (${note})` : ""}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-gradient text-label font-semibold">
          ~{credits} credit{credits === 1 ? "" : "s"}
        </span>
        <CreditValue credits={credits} className="text-caption text-muted" />
      </span>
    </div>
  );
}
