import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TIERS, TIER_INFO, CREDIT_VALUE_USD } from "@/lib/constants";
import { PlanPrice } from "@/components/pricing/plan-price";
import { CurrencySelector } from "@/components/currency-selector";

export const metadata: Metadata = { title: "Pricing" };

const FAQS = [
  {
    q: "What's a credit?",
    a: `Credits are consumed per generation based on model, resolution, and duration — video costs scale with the underlying compute, so a longer or higher-resolution clip costs more than a quick 480p one. Each credit is worth $${CREDIT_VALUE_USD} — shown in your chosen currency throughout the app, and the exact cost is always shown before you generate.`,
  },
  {
    q: "Do unused credits roll over?",
    a: "Up to 50% of unused monthly credits roll over to the next month on paid plans.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes — upgrades and downgrades apply immediately from your billing settings.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan gives you 10 credits every month at no cost, forever — no credit card required.",
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-heading font-bold tracking-tight text-ink sm:text-display">
          <span className="text-gradient">Pricing</span>
        </h1>
        <p className="mt-4 text-body text-muted">
          Simple credit-based pricing. Pay for what you generate, cancel anytime.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-caption text-muted">Currency</span>
          <CurrencySelector />
        </div>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const info = TIER_INFO[tier];
          const isPopular = tier === "starter";
          return (
            <Card
              key={tier}
              variant="standard"
              className={cn(
                "flex flex-col",
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
              <h2 className="text-subheading font-semibold text-ink">{info.label}</h2>
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
                href={tier === "enterprise" ? "/contact" : "/signup"}
                className={buttonVariants({
                  variant: isPopular ? "primary" : "secondary",
                  className: "mt-8 w-full",
                })}
              >
                {tier === "enterprise" ? "Contact sales" : "Get started"}
              </Link>
            </Card>
          );
        })}
      </div>

      <div className="mx-auto mt-24 max-w-2xl">
        <h2 className="text-center text-heading font-bold text-ink">
          Frequently asked questions
        </h2>
        <dl className="mt-10 space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border-b border-line pb-6">
              <dt className="text-label font-medium text-ink">{faq.q}</dt>
              <dd className="mt-2 text-body-sm text-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
