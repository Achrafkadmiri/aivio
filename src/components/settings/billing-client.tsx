"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { TIER_INFO, type Tier } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { formatCredits } from "@/lib/utils";
import { PlanSwitcher } from "@/components/settings/plan-switcher";
import { PlanPrice } from "@/components/pricing/plan-price";
import { CreditValue } from "@/components/credit-value";
import { CurrencySelector } from "@/components/currency-selector";

type SubscriptionResponse = {
  tier: string;
  info: (typeof TIER_INFO)[Tier];
  credits_used_this_month: number;
  credits_limit: number | null;
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

  const { tier, info, credits_used_this_month, credits_limit } = data;
  const usedPct = credits_limit
    ? Math.min(100, Math.round((credits_used_this_month / credits_limit) * 100))
    : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted">Display currency</p>
        <CurrencySelector />
      </div>

      <Card variant="standard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-muted">Current plan</p>
            <h2 className="mt-1 text-subheading font-semibold text-ink">{info.label}</h2>
          </div>
          <p className="text-heading font-bold text-ink">
            <PlanPrice priceMonthly={info.priceMonthly} suffixClassName="text-body-sm text-muted" />
          </p>
        </div>
        {credits_limit !== null && (
          <div className="mt-6">
            <Progress value={usedPct} />
            <p className="mt-2 text-caption text-muted">
              {formatCredits(credits_used_this_month)} / {formatCredits(credits_limit)} credits used
              this month
              {" · "}
              <CreditValue credits={credits_used_this_month} />
            </p>
          </div>
        )}
      </Card>

      <div className="rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-caption text-muted">
        Payments are simulated in this preview — switching plans below is instant and free, no
        card required.
      </div>

      <PlanSwitcher currentTier={tier} />
    </div>
  );
}
