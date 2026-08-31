"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { TierInfo } from "@/lib/constants";

export type UsageResponse = { credit_balance: number; tier_info?: TierInfo };

// Every view that shows a credit balance/usage number reads from one of
// these three queries. Call the returned function anywhere a mutation
// changes the balance server-side (a generation is submitted or refunded, a
// plan switch or recharge purchase succeeds) so every view picks up the
// change immediately instead of waiting for its next natural refetch.
// Stable across renders (useCallback) so it's safe to put in a useEffect
// dependency array without retriggering the effect every render.
export function useInvalidateCredits() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["usage"] });
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }, [queryClient]);
}

/**
 * The signed-in user's balance and plan limits, on the same ["usage"] key
 * every other credit view already reads — so a composer form calling this
 * hits the cache the generate workspace has already filled rather than
 * firing its own request, and useInvalidateCredits above refreshes both at
 * once after a generation is submitted.
 *
 * Lives here rather than being prop-drilled because five different composer
 * forms need it to price and gate their submit button, and each one is
 * already several props deep.
 */
export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await apiFetch("/api/user/usage");
      if (!res.ok) throw new Error("Failed to load usage");
      return res.json();
    },
  });
}
