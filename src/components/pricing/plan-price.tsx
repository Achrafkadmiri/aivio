"use client";

import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/currency";

/** Currency-aware replacement for the old hardcoded `$${priceMonthly}` displays. */
export function PlanPrice({
  priceMonthly,
  className,
  suffixClassName,
  showSuffix = true,
}: {
  priceMonthly: number | null;
  className?: string;
  suffixClassName?: string;
  showSuffix?: boolean;
}) {
  const { currency } = useCurrency();

  if (priceMonthly === null) {
    return <span className={className}>Custom</span>;
  }

  return (
    <>
      <span className={className}>{formatMoney(priceMonthly, currency)}</span>
      {showSuffix && <span className={suffixClassName}>/month</span>}
    </>
  );
}
