"use client";

import { useCurrency } from "@/components/providers/currency-provider";
import { CURRENCIES, CURRENCY_INFO } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="radiogroup"
      aria-label="Currency"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-2 p-1",
        className,
      )}
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={currency === code}
          title={CURRENCY_INFO[code].label}
          onClick={() => setCurrency(code)}
          className={cn(
            "rounded-full px-3 py-1.5 text-caption font-semibold transition-colors",
            currency === code ? "bg-ink text-surface" : "text-muted hover:text-ink-soft",
          )}
        >
          {CURRENCY_INFO[code].symbol}
        </button>
      ))}
    </div>
  );
}
