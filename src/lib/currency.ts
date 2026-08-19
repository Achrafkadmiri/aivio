export const CURRENCIES = ["USD", "EUR", "MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

// This app has no live payment provider (see api/subscription/upgrade —
// payments are simulated), so there's no billing backend to source live FX
// rates from. These are a fixed snapshot for display purposes only, not
// real-time rates.
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
