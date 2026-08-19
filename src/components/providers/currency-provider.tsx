"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { CURRENCIES, type Currency } from "@/lib/currency";

const STORAGE_KEY = "aivio-currency";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Currency {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && (CURRENCIES as readonly string[]).includes(stored) ? (stored as Currency) : "USD";
}

// Server always renders USD — localStorage doesn't exist there, and
// useSyncExternalStore reconciles the mismatch on hydration for us.
function getServerSnapshot(): Currency {
  return "USD";
}

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (currency: Currency) => void;
} | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setCurrency(next: Currency) {
    window.localStorage.setItem(STORAGE_KEY, next);
    // The native "storage" event only fires in *other* tabs — dispatch it
    // manually so this tab's useSyncExternalStore subscribers re-read too.
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
  }

  const value = useMemo(() => ({ currency, setCurrency }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
