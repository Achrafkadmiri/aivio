import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TIER_INFO } from "@/lib/constants";
import { Reveal } from "@/components/marketing/reveal";
import { PlanPrice } from "@/components/pricing/plan-price";

const PREVIEW_TIERS = ["free", "starter", "pro"] as const;

export function PricingPreview() {
  return (
    <section className="border-t border-line bg-surface-2/30 py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-bold text-ink">Simple, transparent pricing</h2>
          <p className="mt-4 text-body text-muted">Start free. Upgrade when you&apos;re ready to scale.</p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PREVIEW_TIERS.map((tier, index) => {
            const info = TIER_INFO[tier];
            const isPopular = tier === "starter";
            return (
              <Reveal key={tier} delayMs={index * 100}>
              <Card
                variant="standard"
                className={cn(
                  "flex h-full flex-col",
                  isPopular && "relative border-brand/40 shadow-glow-sm",
                )}
              >
                {isPopular && (
                  <Badge
                    variant="brand"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-glow-sm"
                  >
                    Most popular
                  </Badge>
                )}
                <h3 className="text-feature-title font-semibold text-ink">{info.label}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <PlanPrice
                    priceMonthly={info.priceMonthly}
                    className="text-heading font-bold text-ink"
                    suffixClassName="text-body-sm text-muted"
                  />
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {info.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-body-sm text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={buttonVariants({
                    variant: isPopular ? "primary" : "secondary",
                    className: "mt-8 w-full",
                  })}
                >
                  Get started
                </Link>
              </Card>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 text-center text-body-sm text-muted">
          Need more?{" "}
          <Link href="/pricing" className="text-brand hover:text-brand-hover">
            Compare all plans
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="text-brand hover:text-brand-hover">
            contact sales
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
