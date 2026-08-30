import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TIERS, TIER_INFO, CREDIT_VALUE_USD } from "@/lib/constants";
import { PlanFeatureList } from "@/components/pricing/plan-feature-list";
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
    a: "On Créateur and Studio, unused monthly credits roll over for 1 extra month. Découverte and Starter credits reset each month.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes — upgrades and downgrades apply immediately from your billing settings.",
  },
  {
    q: "Is there a free trial?",
    a: "The Découverte plan gives you 50 credits every month at no cost, forever — no credit card required.",
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
          const isPopular = tier === "creator";
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
              <PlanFeatureList
                features={info.features}
                note={info.featuresNote}
                className="mt-6 flex-1"
              />
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
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-caption text-muted">
        Model quantities are estimates assuming 100% of that month&apos;s credits are spent on a
        single format — mix and match images and video freely, and the exact cost is always shown
        before you generate.
      </p>

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
