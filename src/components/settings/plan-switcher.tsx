"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { TIERS, TIER_INFO, type Tier } from "@/lib/constants";
import { PlanFeatureList } from "@/components/pricing/plan-feature-list";
import { PlanPrice } from "@/components/pricing/plan-price";
import { apiFetch } from "@/lib/api-client";
import { formatCredits } from "@/lib/utils";
import { useInvalidateCredits } from "@/hooks/use-credits";

/**
 * What POST /api/subscription/upgrade reports back.
 *
 * `outcome` is the part worth showing. A switch does not always credit
 * anything: the API grants a plan's credits only when it outranks the
 * highest plan already credited this month, so re-picking a plan you held
 * earlier in the month, or moving down, changes the tier and pays out
 * nothing. The balance alone can't tell those apart from a successful
 * grant — see the high-water-mark rule on /upgrade in the Edge Function.
 */
type SwitchResult = {
  tier: Tier;
  credit_balance: number;
  outcome: "granted" | "no_grant" | "unchanged";
  credits_granted: number;
  /** Set only on "no_grant": the plan that already took this month's
   *  grant, which is the reason nothing was credited. */
  already_granted_tier: Tier | null;
  /** What the next renewal adds. Zero on a plan that doesn't renew. */
  next_renewal_credits: number;
  /** False on a plan with no recurring allowance (Free's credits are a
   *  one-time grant), where "arrives at your next renewal" would be a lie. */
  plan_renews: boolean;
};

function tierLabel(tier: string) {
  return TIER_INFO[tier as Tier]?.label ?? tier;
}

/**
 * Reports what the switch actually did.
 *
 * A toast was not enough here: "Switched to Creator" is true and still
 * misleading on the no-grant path, where the user is left looking for
 * credits that were never coming. This states the outcome and the resulting
 * balance, and has to be dismissed.
 */
function SwitchResultDialog({ result, onClose }: { result: SwitchResult | null; onClose: () => void }) {
  if (!result) return null;

  const label = tierLabel(result.tier);
  // Three outcomes, and the no-grant one splits again on whether the plan
  // renews at all: landing on a plan that issues nothing further is a
  // different fact from "this cycle was already paid out", and promising a
  // renewal that never comes is the exact confusion this dialog exists to
  // prevent.
  const body =
    result.outcome === "granted"
      ? `${label}'s ${formatCredits(result.credits_granted)} credits are on your account now.`
      : result.outcome === "no_grant"
        ? result.plan_renews
          ? `No credits were added this time — this month's allowance was already issued at ${tierLabel(
              result.already_granted_tier ?? result.tier,
            )}, so your balance is unchanged. ${label}'s ${formatCredits(
              result.next_renewal_credits,
            )} credits arrive at your next renewal.`
          : `Your balance is unchanged, and it stays that way: ${label} has no monthly allowance. Credits you already hold keep working — top up with a credit pack, or move to a paid plan for a monthly refill.`
        : `You were already on ${label}, so nothing changed.`;

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={result.outcome === "unchanged" ? `Still on ${label}` : `Now on ${label}`}
    >
      <p className="text-body-sm text-muted">{body}</p>
      <div className="mt-4 flex items-baseline justify-between rounded-lg border border-line px-4 py-3">
        <span className="text-body-sm text-muted">Credit balance</span>
        <span className="text-subheading font-semibold text-ink">
          {formatCredits(result.credit_balance)}
        </span>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}

export function PlanSwitcher({ currentTier }: { currentTier: string }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const invalidateCredits = useInvalidateCredits();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [result, setResult] = useState<SwitchResult | null>(null);

  async function switchTo(tier: Tier) {
    const target = TIER_INFO[tier];
    const ok = await confirm({
      title: `Switch to ${target.label}?`,
      // Deliberately not "your allowance is reset to the new plan's", which
      // this used to say and which is wrong in both directions: moving down
      // doesn't take credits away, and moving back up to a plan you already
      // held this month doesn't add any.
      description:
        "Your plan changes right away. If it ranks above any plan you've already been credited for this month, you get its full credits now — otherwise your balance stays as it is and the new allowance starts at your next renewal.",
      confirmLabel: `Switch to ${target.label}`,
    });
    if (!ok) return;

    setLoadingTier(tier);
    try {
      const res = await apiFetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to switch plan");
      invalidateCredits();
      setResult(json as SwitchResult);
    } catch (err) {
      toast({
        title: "Couldn't switch plan",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const info = TIER_INFO[tier];
          const isCurrent = tier === currentTier;
          return (
            <Card key={tier} variant="compact" className="flex flex-col">
              <h3 className="font-mono text-label font-semibold text-ink">{info.label}</h3>
              <p className="mt-1 text-heading font-bold text-ink">
                <PlanPrice priceMonthly={info.priceMonthly} showSuffix={false} />
              </p>
              <PlanFeatureList
                features={info.features.slice(0, 3)}
                note={info.featuresNote}
                size="sm"
                className="mt-3 flex-1"
              />
              <Button
                variant={isCurrent ? "secondary" : "primary"}
                disabled={isCurrent}
                loading={loadingTier === tier}
                onClick={() => switchTo(tier)}
                className="mt-4 w-full"
              >
                {isCurrent ? "Current plan" : "Switch"}
              </Button>
            </Card>
          );
        })}
      </div>
      <SwitchResultDialog result={result} onClose={() => setResult(null)} />
    </>
  );
}
