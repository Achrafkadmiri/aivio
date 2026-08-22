"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
