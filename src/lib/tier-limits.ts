// Client-side mirror of the server-side tier enforcement in
// aiVideo-backend's generations.ts (VIDEO_RESOLUTION_RANK / maxDurationSeconds
// checks) — used to proactively lock options in the generate forms instead
// of letting the user pick something the backend will reject. The backend
// remains the source of truth; this is UX only.
import { TIER_INFO, TIERS, type Tier } from "@/lib/constants";

export const RESOLUTION_RANK: Record<string, number> = { "480p": 1, "720p": 2, "1080p": 3, "4k": 4 };

type TierLimits = { maxResolution: string; maxDurationSeconds: number; videoWatermark: boolean };

export function isResolutionLocked(resolution: string, tierInfo: TierLimits | undefined): boolean {
  if (!tierInfo) return false;
  const requestedRank = RESOLUTION_RANK[resolution];
  const tierRank = RESOLUTION_RANK[tierInfo.maxResolution];
  if (!requestedRank || !tierRank) return false;
  return requestedRank > tierRank;
}

export function isDurationLocked(durationSeconds: number, tierInfo: TierLimits | undefined): boolean {
  if (!tierInfo) return false;
  return durationSeconds > tierInfo.maxDurationSeconds;
}

/** The cheapest tier whose maxResolution covers `resolution` — used to word
 * the "Upgrade to X" hint on a locked option. */
export function minTierForResolution(resolution: string): Tier | undefined {
  const requestedRank = RESOLUTION_RANK[resolution];
  if (!requestedRank) return undefined;
  return TIERS.find((t) => (RESOLUTION_RANK[TIER_INFO[t].maxResolution] ?? 0) >= requestedRank);
}

/** The cheapest tier whose maxDurationSeconds covers `durationSeconds`. */
export function minTierForDuration(durationSeconds: number): Tier | undefined {
  return TIERS.find((t) => TIER_INFO[t].maxDurationSeconds >= durationSeconds);
}

/** The cheapest tier that doesn't force a watermark onto every video. */
export function minTierWithoutForcedWatermark(): Tier | undefined {
  return TIERS.find((t) => !TIER_INFO[t].videoWatermark);
}

export function upgradeHint(minTier: Tier | undefined, what: string): string {
  if (!minTier) return `Not available on your plan.`;
  return `Upgrade to ${TIER_INFO[minTier].label} to unlock ${what}.`;
}
