"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { TIER_INFO, type Tier } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { formatCredits } from "@/lib/utils";
import { PlanSwitcher } from "@/components/settings/plan-switcher";
import { RechargePacks } from "@/components/settings/recharge-packs";
import { PlanPrice } from "@/components/pricing/plan-price";
import { CreditValue } from "@/components/credit-value";
import { CurrencySelector } from "@/components/currency-selector";

type SubscriptionResponse = {
  tier: string;
  info: (typeof TIER_INFO)[Tier];
  credits_used_this_month: number;
  credits_limit: number;
  credit_balance: number;
  credits_expiring_soon: number;
};

function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async (): Promise<SubscriptionResponse> => {
      const res = await apiFetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to load subscription");
      return res.json();
    },
  });
}

export function BillingClient() {
  const { data, isLoading } = useSubscription();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const { tier, info, credits_used_this_month, credits_limit, credit_balance, credits_expiring_soon } = data;
  const usedPct = credits_limit
    ? Math.min(100, Math.round((credits_used_this_month / credits_limit) * 100))
    : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted">Display currency</p>
        <CurrencySelector />
      </div>

      <Card variant="standard" className="relative overflow-hidden hover:translate-y-0 hover:shadow-card">
        <div
          className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand opacity-30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-caption text-muted">Current plan</p>
            <h2 className="mt-1 text-subheading font-semibold text-ink">{info.label}</h2>
          </div>
          <p className="text-heading font-bold text-ink">
            <PlanPrice priceMonthly={info.priceMonthly} suffixClassName="text-body-sm text-muted" />
          </p>
        </div>

        <div className="relative mt-6 flex items-baseline justify-between">
          <p className="text-caption text-muted">Credit balance</p>
          <p className="text-subheading font-bold text-ink">
            {formatCredits(credit_balance)}
            <CreditValue credits={credit_balance} className="ml-2 text-caption font-normal text-muted" />
          </p>
        </div>
        {credits_expiring_soon > 0 && (
          <p className="relative mt-1 text-right text-caption text-warning">
            {formatCredits(credits_expiring_soon)} credits expire soon
          </p>
        )}

        <div className="relative mt-4">
          <Progress value={usedPct} />
          <p className="mt-2 text-caption text-muted">
            {formatCredits(credits_used_this_month)} / {formatCredits(credits_limit)} credits used
            this month
          </p>
        </div>
      </Card>

      <div className="rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-caption text-muted">
        Payments are simulated in this preview — switching plans and buying credit packs below is
        instant and free, no card required.
      </div>

      <PlanSwitcher currentTier={tier} />

      <RechargePacks />
    </div>
  );
}
