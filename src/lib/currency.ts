export const CURRENCIES = ["USD", "EUR", "MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Display only, and deliberately so: every Stripe price is created in USD
// (see the backend's scripts/stripe-setup.ts), so a card is always charged
// in dollars no matter which currency is selected here. These rates are a
// fixed snapshot for showing a familiar number next to a price, not
// real-time rates and not what anyone is billed — which is why the checkout
// confirmations say the payment happens at Stripe rather than quoting a
// converted figure as the amount.
export const CURRENCY_INFO: Record<Currency, { label: string; symbol: string; rateFromUsd: number }> = {
  USD: { label: "US Dollar", symbol: "$", rateFromUsd: 1 },
  EUR: { label: "Euro", symbol: "€", rateFromUsd: 0.92 },
  MAD: { label: "Moroccan Dirham", symbol: "MAD", rateFromUsd: 9.95 },
};

export function convertFromUsd(amountUsd: number, currency: Currency) {
  return amountUsd * CURRENCY_INFO[currency].rateFromUsd;
}

export function formatMoney(
  amountUsd: number,
  currency: Currency,
  opts: { maximumFractionDigits?: number } = {},
) {
  const converted = convertFromUsd(amountUsd, currency);
  const maximumFractionDigits = opts.maximumFractionDigits ?? 2;
  const minimumFractionDigits = converted === 0 ? 0 : Math.min(2, maximumFractionDigits);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(converted);
  const { symbol } = CURRENCY_INFO[currency];
  return currency === "MAD" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}
