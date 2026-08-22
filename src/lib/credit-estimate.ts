// DUPLIQUÉ dans aiVideo-backend/src/lib/credit-estimate.ts — garder synchronisé.
import { SEEDANCE_MODEL_ID, SEEDANCE_DURATION_MIN, type GenerationType, type VideoResolution } from "@/lib/constants";

// Pure cost-estimation logic — imported client-side too (e.g. for a live
// "estimated cost" readout in the generate forms), no network round-trip.

// Per-second credit rates by model, keyed by resolution since tiers differ
// per model (e.g. Seedance offers 480p/720p, not 720p/1080p).
//
// bytedance/seedance-2.5 and bytedance/seedance-2.0 are priced straight from
// the "Plan Tarifaire Créateur" pricing artifact's real per-second Seedance
// cost table (2026-08-22), converted 1:1 at CREDIT_VALUE_USD ($0.01/credit,
// see constants.ts) — credits/s = round(rateUsd * 100), no markup:
//   2.0 text→video   480p $0.070/s, 720p $0.150/s, 1080p $0.370/s, 4k $0.780/s
//   2.0 video→video  480p $0.172/s, 720p $0.372/s, 1080p $0.914/s, 4k $1.866/s
//   2.5 text→video   480p $0.103/s, 720p $0.231/s (no 1080p/4k — see usesKieAi below)
// `videoRates` (2.0 only) applies when a reference video/image is attached —
// unlike 2.5, Seedance 2.0 never routes to kie.ai, so its higher
// reference-conditioned cost is priced directly here instead of via the
// SEEDANCE25_KIE_AI_RATE table below. minCredits/minCreditsVideo are the
// floor cost of the shortest supported clip (SEEDANCE_DURATION_MIN /
// SEEDANCE2_DURATION_MIN) at the model's cheapest resolution.
//
// Every other entry below has no real per-model pricing to draw on, so it's
// still an *estimate* — scaled proportionally off the real
// bytedance/seedance-2.0 text→video rates above, using the same relative
// multiplier each model previously had (documented per-entry below). Their
// minCredits is the cost of a 3s clip (the shortest of the generic
// VIDEO_DURATIONS) at the model's cheapest resolution.
const LIVE_VIDEO_RATE: Record<
  string,
  { rates: Record<string, number>; videoRates?: Record<string, number>; minCredits: number; minCreditsVideo?: number }
> = {
  "bytedance/seedance-2.5": { rates: { "480p": 10, "720p": 23 }, minCredits: 40 },
  "bytedance/seedance-2.0": {
    rates: { "480p": 7, "720p": 15, "1080p": 37, "4k": 78 },
    videoRates: { "480p": 17, "720p": 37, "1080p": 91, "4k": 187 },
    minCredits: 28,
    minCreditsVideo: 68,
  },
  // 0.75x (480p/720p) / 0.8x (1080p) of Seedance 2.0.
  "  bytedance/seedance-2.0-mini": {
    rates: { "480p": 5.25, "720p": 11.25, "1080p": 29.6 },
    minCredits: 16,
  },
  // 1.33x (720p) / 1.3x (1080p) of Seedance 2.0.
  "  black-forest-labs/flux-3-video": {
    rates: { "720p": 19.95, "1080p": 48.1 },
    minCredits: 60,
  },
  // 1.25x (480p) / 1.17x (720p) of Seedance 2.0.
  "  xai/grok-imagine-video": {
    rates: { "480p": 8.75, "720p": 17.55 },
    minCredits: 26,
  },
  // 1.5x (both) of Seedance 2.0.
  "  xai/grok-imagine-video-1.5-preview": {
    rates: { "480p": 10.5, "720p": 22.5 },
    minCredits: 32,
  },
  // 0.83x (720p) / 0.8x (1080p) of Seedance 2.0.
  "  alibaba/hh1.1-i2v": {
    rates: { "720p": 12.45, "1080p": 29.6 },
    minCredits: 37,
  },
  "  alibaba/wan-2.7-i2v": {
    rates: { "720p": 12.45, "1080p": 29.6 },
    minCredits: 37,
  },
  // Google's flagship video model, native audio — 1.67x (720p) / 1.6x
  // (1080p) of Seedance 2.0, the priciest tier here, reflecting that
  // positioning.
  "  google/veo-3.1": {
    rates: { "720p": 25.05, "1080p": 59.2 },
    minCredits: 75,
  },
  // 1.17x (720p) / 1.1x (1080p) of Seedance 2.0.
  "  google/veo-3.1-fast": {
    rates: { "720p": 17.55, "1080p": 40.7 },
    minCredits: 53,
  },
};
// duration=-1 ("automatic") doesn't tell us the real output length ahead of
// time, so cost estimation assumes this many seconds for that case. Only
// Seedance 2.5 supports auto duration — 2.0 always sends a real 4-12s value.
const LIVE_VIDEO_AUTO_DURATION_ESTIMATE = 8;

// The artifact's 2-bucket image pricing: a "quality" model catalog id costs
// 5 credits, every other (fast) model costs 1 — judgment call mapping this
// app's actual Cloudflare catalog (cloudflare-models.ts) onto the artifact's
// illustrative Flux-Schnell/Dev/Pro/Imagen/Nano-Banana examples, none of
// which are in this catalog: the three ids below are the only ones whose own
// label/description says "pro"/flagship/"quality".
const QUALITY_IMAGE_MODELS = new Set([
  " /recraft/recraftv4-1-pro",
  "  leonardo/phoenix-1.0",
  "  xai/grok-imagine-image-quality",
]);
const FAST_IMAGE_CREDITS = 1;
const QUALITY_IMAGE_CREDITS = 5;

// Seedance 2.5 at 1080p, or with a reference video attached, routes to
// kie.ai instead of Cloudflare — Cloudflare's integration can't serve
// either case. Real kie.ai per-second cost (dashboard, 2026-08-18),
// converted 1:1 at CREDIT_VALUE_USD like the tables above (no markup):
//   with reference video: 480p $0.085/s, 720p $0.190/s, 1080p $0.3425/s
//   1080p, no reference video: $0.570/s (720p/480p without a reference
//   video never reach kie.ai — those stay on Cloudflare, see usesKieAi below)
// Counterintuitively cheaper *with* a reference video at every resolution —
// confirmed against the dashboard rather than assumed to be a typo.
const SEEDANCE25_KIE_AI_RATE = {
  withVideo: { "480p": 8.5, "720p": 19, "1080p": 34.25 } as Record<string, number>,
  noVideo1080p: 57,
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

  const entry = LIVE_VIDEO_RATE[model];
  const useVideoRates = options.hasReferenceVideo && entry.videoRates;
  const rates = useVideoRates ? entry.videoRates! : entry.rates;
  const minCredits = useVideoRates ? (entry.minCreditsVideo ?? entry.minCredits) : entry.minCredits;
  const perSecond = rates[resolution] ?? Math.max(...Object.values(rates));
  return Math.max(minCredits, Math.round(effectiveDuration * perSecond));
}

export function estimateImageCredits(model: string) {
  return QUALITY_IMAGE_MODELS.has(model) ? QUALITY_IMAGE_CREDITS : FAST_IMAGE_CREDITS;
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
