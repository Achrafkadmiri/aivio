// DUPLIQUÉ dans aiVideo-backend/src/lib/credit-estimate.ts — garder synchronisé.
import { SEEDANCE_MODEL_ID, SEEDANCE_DURATION_MIN, type GenerationType, type VideoResolution } from "@/lib/constants";

// Pure cost-estimation logic, deliberately split out of credits.ts (which is
// "server-only" because it touches Prisma) so generation forms can import it
// client-side and show a live "estimated cost" readout as the user tweaks
// params, without a network round-trip.

// Per-second credit rates by model, keyed by resolution since tiers differ
// per model (e.g. Seedance offers 480p/720p, not 720p/1080p).
//
// bytedance/seedance-2.5 and bytedance/seedance-2.0 are priced straight from
// Cloudflare's real per-second Neuron cost (dashboard, 2026-08-18,
// non-video-input row — this app never sends a reference_video, that upload
// tile is disabled in both Seedance forms, see SeedanceInput/Seedance2Input
// in cloudflare-ai.ts). Each rate = rawCostUsd * PROVIDER_COST_MARGIN /
// CREDIT_VALUE_USD, so it's directly traceable back to what Cloudflare
// charges plus our margin:
//   2.5  480p $0.1028/s, 720p $0.2312/s
//   2.0  480p $0.070/s, 720p $0.150/s, 1080p $0.370/s, 4k $0.780/s
// minCredits is the cost of the shortest supported clip at the model's
// cheapest resolution (SEEDANCE_DURATION_MIN / SEEDANCE2_DURATION_MIN) — a
// real floor, not an arbitrary number.
//
// Every other entry below has no real per-model Cloudflare pricing to draw
// on, so it's still an *estimate* — scaled proportionally off the real
// bytedance/seedance-2.0 rates above, using the same relative multiplier
// each model previously had against the old placeholder Seedance 2.0 scale
// (0.4 / 0.6 / 1 / 2 480p/720p/1080p/4k). Their minCredits is the cost of a
// 3s clip (the shortest of the generic VIDEO_DURATIONS) at the model's
// cheapest resolution. Check the Cloudflare dashboard before trusting these
// for real billing.
const LIVE_VIDEO_RATE: Record<string, { rates: Record<string, number>; minCredits: number }> = {
  "bytedance/seedance-2.5": { rates: { "480p": 22.84, "720p": 51.38 }, minCredits: 91 },
  "bytedance/seedance-2.0": {
    rates: { "480p": 15.56, "720p": 33.33, "1080p": 82.22, "4k": 173.33 },
    minCredits: 62,
  },
  // 0.75x (480p/720p) / 0.8x (1080p) of Seedance 2.0.
  "  bytedance/seedance-2.0-mini": {
    rates: { "480p": 11.67, "720p": 25.0, "1080p": 65.78 },
    minCredits: 35,
  },
  // 1.33x (720p) / 1.3x (1080p) of Seedance 2.0.
  "  black-forest-labs/flux-3-video": {
    rates: { "720p": 44.44, "1080p": 106.89 },
    minCredits: 133,
  },
  // 1.25x (480p) / 1.17x (720p) of Seedance 2.0.
  "  xai/grok-imagine-video": {
    rates: { "480p": 19.44, "720p": 38.89 },
    minCredits: 58,
  },
  // 1.5x (both) of Seedance 2.0.
  "  xai/grok-imagine-video-1.5-preview": {
    rates: { "480p": 23.33, "720p": 50.0 },
    minCredits: 70,
  },
  // 0.83x (720p) / 0.8x (1080p) of Seedance 2.0.
  "  alibaba/hh1.1-i2v": {
    rates: { "720p": 27.78, "1080p": 65.78 },
    minCredits: 83,
  },
  "  alibaba/wan-2.7-i2v": {
    rates: { "720p": 27.78, "1080p": 65.78 },
    minCredits: 83,
  },
  // Google's flagship video model, native audio — 1.67x (720p) / 1.6x
  // (1080p) of Seedance 2.0, the priciest tier here, reflecting that
  // positioning.
  "  google/veo-3.1": {
    rates: { "720p": 55.56, "1080p": 131.56 },
    minCredits: 167,
  },
  // 1.17x (720p) / 1.1x (1080p) of Seedance 2.0.
  "  google/veo-3.1-fast": {
    rates: { "720p": 38.89, "1080p": 90.44 },
    minCredits: 117,
  },
};
// duration=-1 ("automatic") doesn't tell us the real output length ahead of
// time, so cost estimation assumes this many seconds for that case. Only
// Seedance 2.5 supports auto duration — 2.0 always sends a real 4-12s value.
const LIVE_VIDEO_AUTO_DURATION_ESTIMATE = 8;

// Flat per-generation estimate for the Cloudflare-registry live image
// models (cloudflare-models.ts) — most don't have a meaningful resolution
// axis to key off. Also an estimate, not real Cloudflare billing. `n`
// (image count on the two xAI models) is deliberately not factored in —
// flat per-request cost, for simplicity.
const FLAT_IMAGE_COST: Record<string, number> = {
  "  recraft/recraftv4-1": 2,
  "  recraft/recraftv4-1-pro": 4,
  "  recraft/recraftv4-1-vector": 3,
  "  leonardo/lucid-origin": 2,
  "  leonardo/phoenix-1.0": 3,
  "  google/nano-banana-2-lite": 1,
  "  xai/grok-imagine-image": 2,
  "  xai/grok-imagine-image-quality": 4,
  "  stabilityai/stable-diffusion-xl-base-1.0": 3,
};

// Seedance 2.5 at 1080p, or with a reference video attached, routes to
// kie.ai instead of Cloudflare (see generation-engine.ts) — Cloudflare's
// integration can't serve either case. Real kie.ai per-second cost
// (dashboard, 2026-08-18), same rateUsd * PROVIDER_COST_MARGIN /
// CREDIT_VALUE_USD formula as the two Cloudflare tables above:
//   with reference video: 480p $0.085/s, 720p $0.190/s, 1080p $0.3425/s
//   1080p, no reference video: $0.570/s (720p/480p without a reference
//   video never reach kie.ai — those stay on Cloudflare, see usesKieAi below)
// Counterintuitively cheaper *with* a reference video at every resolution —
// confirmed against the dashboard rather than assumed to be a typo.
const SEEDANCE25_KIE_AI_RATE = {
  withVideo: { "480p": 18.89, "720p": 42.22, "1080p": 76.11 } as Record<string, number>,
  noVideo1080p: 126.67,
};
const SEEDANCE25_KIE_AI_MIN_CREDITS = Math.round(
  SEEDANCE_DURATION_MIN * SEEDANCE25_KIE_AI_RATE.withVideo["480p"],
);

export function estimateVideoCredits(
  model: string,
  durationSeconds: number,
  resolution: VideoResolution | string,
  options: { hasReferenceVideo?: boolean } = {},
) {
  const usesKieAi =
    model === SEEDANCE_MODEL_ID && (resolution === "1080p" || options.hasReferenceVideo);
  const effectiveDuration =
    durationSeconds === -1 ? LIVE_VIDEO_AUTO_DURATION_ESTIMATE : durationSeconds;

  if (usesKieAi) {
    const perSecond = options.hasReferenceVideo
      ? (SEEDANCE25_KIE_AI_RATE.withVideo[resolution] ?? SEEDANCE25_KIE_AI_RATE.withVideo["1080p"])
      : SEEDANCE25_KIE_AI_RATE.noVideo1080p;
    return Math.max(SEEDANCE25_KIE_AI_MIN_CREDITS, Math.round(effectiveDuration * perSecond));
  }

  const { rates, minCredits } = LIVE_VIDEO_RATE[model];
  const perSecond = rates[resolution] ?? Math.max(...Object.values(rates));
  return Math.max(minCredits, Math.round(effectiveDuration * perSecond));
}

export function estimateImageCredits(model: string) {
  return FLAT_IMAGE_COST[model] ?? 2;
}

export function estimateCreditsForRequest(input: {
  type: GenerationType;
  model: string;
  durationSeconds?: number;
  resolution?: string;
  hasReferenceVideo?: boolean;
}) {
  if (input.type === "text-to-image") {
    return estimateImageCredits(input.model);
  }
  return estimateVideoCredits(
    input.model,
    input.durationSeconds ?? 5,
    (input.resolution ?? "720p") as VideoResolution,
    { hasReferenceVideo: input.hasReferenceVideo },
  );
}
