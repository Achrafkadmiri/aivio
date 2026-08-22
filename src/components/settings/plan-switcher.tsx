"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TIERS, TIER_INFO, type Tier } from "@/lib/constants";
import { PlanPrice } from "@/components/pricing/plan-price";
import { apiFetch } from "@/lib/api-client";
import { useInvalidateCredits } from "@/hooks/use-credits";

export function PlanSwitcher({ currentTier }: { currentTier: string }) {
  const { toast } = useToast();
  const invalidateCredits = useInvalidateCredits();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function switchTo(tier: Tier) {
    setLoadingTier(tier);
    try {
      const res = await apiFetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to switch plan");
      toast({ title: `Switched to ${TIER_INFO[tier].label}`, variant: "success" });
      invalidateCredits();
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
            <ul className="mt-3 flex-1 space-y-2">
              {info.features.slice(0, 3).map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-caption text-muted">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
                  {feat}
                </li>
              ))}
            </ul>
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
  );
}
