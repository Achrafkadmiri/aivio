"use client";

import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/currency";
import { CREDIT_VALUE_USD } from "@/lib/constants";

/** Renders a credit amount's real-money equivalent, e.g. "≈ $0.045". */
export function CreditValue({ credits, className }: { credits: number; className?: string }) {
  const { currency } = useCurrency();

  if (!Number.isFinite(credits)) return null;

  return (
    <span className={className}>
      ≈ {formatMoney(credits * CREDIT_VALUE_USD, currency, { maximumFractionDigits: 3 })}
    </span>
  );
}
