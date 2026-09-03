"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/currency";
import { formatCredits } from "@/lib/utils";
import { RECHARGE_PACKS, type RechargePackId } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { useInvalidateCredits } from "@/hooks/use-credits";

// Pay-per-use top-up — same "instant, simulated" pattern as PlanSwitcher.
// Credits from these packs never expire, unlike a plan's monthly grant.
export function RechargePacks() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const { currency } = useCurrency();
  const invalidateCredits = useInvalidateCredits();
  const [loadingPack, setLoadingPack] = useState<RechargePackId | null>(null);

  async function buy(packId: RechargePackId, credits: number) {
    const pack = RECHARGE_PACKS.find((p) => p.id === packId);
    const ok = await confirm({
      title: `Buy ${formatCredits(credits)} credits?`,
      description: pack
        ? `You'll be charged ${formatMoney(pack.priceUsd, currency)}. The credits are added immediately and never expire.`
        : "The credits are added immediately and never expire.",
      confirmLabel: "Buy credits",
    });
    if (!ok) return;

    setLoadingPack(packId);
    try {
      const res = await apiFetch("/api/subscription/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to buy credits");
      toast({ title: `Added ${formatCredits(credits)} credits`, variant: "success" });
      invalidateCredits();
    } catch (err) {
      toast({
        title: "Couldn't buy credits",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div>
      <h3 className="text-label font-semibold text-ink">Buy more credits</h3>
      <p className="mt-1 text-caption text-muted">
        Top up any time — these credits never expire and stack on top of your plan.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {RECHARGE_PACKS.map((pack) => (
          <Card
            key={pack.id}
            variant="compact"
            className="flex flex-col items-center text-center transition-[border-color,transform] hover:-translate-y-1 hover:border-border-strong"
          >
            {/* Amber, not the lime action color — this pack tile is about
                value; the lime lives on its buy Button below. */}
            <span className="flex size-10 items-center justify-center rounded-full bg-accent-amber">
              <Zap className="size-4.5 text-on-brand" aria-hidden="true" />
            </span>
            <p className="mt-3 text-subheading font-bold text-accent-amber">{formatCredits(pack.credits)}</p>
            <p className="text-caption text-muted">credits</p>
            <Button
              variant="accent"
              loading={loadingPack === pack.id}
              onClick={() => buy(pack.id, pack.credits)}
              className="mt-4 w-full"
            >
              {formatMoney(pack.priceUsd, currency)}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
