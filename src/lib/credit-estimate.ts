// DUPLIQUÉ dans aiVideo-backend/supabase/functions/api/lib/credit-estimate.ts
// — garder synchronisé.
// Pure cost-estimation logic — imported client-side too (e.g. for a live
// "estimated cost" readout in the generate forms), no network round-trip.

import {
  CREDIT_VALUE_USD,
  SEEDANCE_MODEL_ID,
  SEEDANCE2_MODEL_ID,
  SEEDANCE_DURATION_MIN,
  type GenerationType,
  type VideoResolution,
} from "@/lib/constants";

// ── The pricing rule, stated once ────────────────────────────────────────
// Everything below is a table of *real provider cost in USD*. Credit prices
// are derived from it, never hand-written, so the margin can be retuned in
// one place instead of by re-multiplying every model.
//
// A credit SELLS for CREDIT_VALUE_USD ($0.01 — see constants.ts, where
// every plan and pack is priced at that rate). TARGET_GROSS_MARGIN is the
// cut of that we keep, so a credit may only buy COST_USD_PER_CREDIT =
// $0.005 of provider compute:
//
//   credits = round(seconds × usdPerSecond / COST_USD_PER_CREDIT)
//
// Before 2026-08-30 credits were sold and spent at par ($0.01 of compute
// per $0.01 credit) and the margin came entirely from tiers granting fewer
// credits than their price would buy. That stopped working once the plans
// were repriced to a flat 1000/2500/5000 credits — at par those grant more
// compute than they cost — so the markup now lives on the generation side,
// where it scales with actual usage instead of with the grant.
const TARGET_GROSS_MARGIN = 0.5;
const COST_USD_PER_CREDIT = CREDIT_VALUE_USD * (1 - TARGET_GROSS_MARGIN);

function creditsFor(seconds: number, usdPerSecond: number): number {
  return Math.round((seconds * usdPerSecond) / COST_USD_PER_CREDIT);
}

// Real provider cost per second of output, keyed by resolution since the
// tiers genuinely differ per model (Seedance 2.5 offers 480p/720p, not
// 720p/1080p).
//
// bytedance/seedance-2.5 and bytedance/seedance-2.0 come straight from the
// "Plan Tarifaire Créateur" pricing artifact's measured per-second Seedance
// cost table (2026-08-22). `withReferenceVideo` (2.0 only) applies when a
// reference video/image is attached — the model genuinely costs more in
// that mode.
//
// Every other entry has no published per-second cost to draw on, so it is
// still an *estimate*: the same relative multiplier off bytedance/
// seedance-2.0's text→video cost that each model has always carried,
// documented per-entry below.
//
// `minSeconds` is the shortest clip the model accepts — the floor cost is
// that many seconds at the model's cheapest resolution, so a request can
// never be quoted below what the provider will actually bill us for.
const VIDEO_COST_USD: Record<
  string,
  {
    perSecond: Record<string, number>;
    withReferenceVideo?: Record<string, number>;
    minSeconds: number;
    /** Floor for the withReferenceVideo table, when it differs. */
    minSecondsWithReferenceVideo?: number;
  }
> = {
  "bytedance/seedance-2.5": {
    perSecond: { "480p": 0.103, "720p": 0.231 },
    minSeconds: 4,
  },
  "bytedance/seedance-2.0": {
    perSecond: { "480p": 0.07, "720p": 0.15, "1080p": 0.37, "4k": 0.78 },
    withReferenceVideo: { "480p": 0.172, "720p": 0.372, "1080p": 0.914, "4k": 1.866 },
    minSeconds: 4,
    minSecondsWithReferenceVideo: 4,
  },
  // 0.75x (480p/720p) / 0.8x (1080p) of Seedance 2.0.
  "bytedance/seedance-2.0-mini": {
    perSecond: { "480p": 0.0525, "720p": 0.1125, "1080p": 0.296 },
    minSeconds: 3,
  },
  // 1.33x (720p) / 1.3x (1080p) of Seedance 2.0.
  "black-forest-labs/flux-3-video": {
    perSecond: { "720p": 0.1995, "1080p": 0.481 },
    minSeconds: 3,
  },
  // 1.25x (480p) / 1.17x (720p) of Seedance 2.0.
  "xai/grok-imagine-video": {
    perSecond: { "480p": 0.0875, "720p": 0.1755 },
    minSeconds: 3,
  },
  // 1.5x (both) of Seedance 2.0.
  "xai/grok-imagine-video-1.5-preview": {
    perSecond: { "480p": 0.105, "720p": 0.225 },
    minSeconds: 3,
  },
  // 0.83x (720p) / 0.8x (1080p) of Seedance 2.0.
  "alibaba/hh1.1-i2v": {
    perSecond: { "720p": 0.1245, "1080p": 0.296 },
    minSeconds: 3,
  },
  "alibaba/wan-2.7-i2v": {
    perSecond: { "720p": 0.1245, "1080p": 0.296 },
    minSeconds: 3,
  },
  // Google's flagship video model, native audio — 1.67x (720p) / 1.6x
  // (1080p) of Seedance 2.0, the priciest tier here, reflecting that
  // positioning.
  "google/veo-3.1": {
    perSecond: { "720p": 0.2505, "1080p": 0.592 },
    minSeconds: 3,
  },
  // 1.17x (720p) / 1.1x (1080p) of Seedance 2.0.
  "google/veo-3.1-fast": {
    perSecond: { "720p": 0.1755, "1080p": 0.407 },
    minSeconds: 3,
  },
  // Vidu Q3 — estimates, no published per-second cost. Pro at 1.33x and
  // Turbo at 0.75x of Seedance 2.0's 720p/1080p cost, with 540p carried
  // down proportionally. Both allow 1s clips.
  "vidu/q3-pro": {
    perSecond: { "540p": 0.093, "720p": 0.2, "1080p": 0.49 },
    minSeconds: 1,
  },
  "vidu/q3-turbo": {
    perSecond: { "540p": 0.0525, "720p": 0.1125, "1080p": 0.2775 },
    minSeconds: 1,
  },
  // Pruna P-Video — no published per-second cost to scale from, so this is
  // parity with Seedance 2.0's 720p/1080p cost as a placeholder until real
  // numbers exist. It allows durations down to 1s, unlike everything else
  // here. NOTE: the tables key on resolution only, so a 48fps clip bills
  // the same as 24fps despite rendering twice the frames.
  "pruna/p-video": {
    perSecond: { "720p": 0.15, "1080p": 0.37 },
    minSeconds: 1,
  },
  // MiniMax Hailuo 2.3 — 1.2x (768p) / 1.08x (1080p) of Seedance 2.0. Its
  // shortest clip is 6s (there is no 3s option).
  "minimax/hailuo-2.3": {
    perSecond: { "768p": 0.18, "1080p": 0.4 },
    minSeconds: 6,
  },
};

// duration=-1 ("automatic") doesn't tell us the real output length ahead of
// time, so cost estimation assumes this many seconds for that case. Only
// Seedance 2.5 supports auto duration — 2.0 always sends a real 4-12s value.
const LIVE_VIDEO_AUTO_DURATION_ESTIMATE = 8;

// Two-bucket image pricing: a "quality" catalog id is priced off a $0.05
// provider cost, every other (fast) model off $0.01 — a judgment call
// mapping this app's actual Cloudflare catalog (cloudflare-models.ts) onto
// the pricing artifact's illustrative Flux-Schnell/Dev/Pro/Imagen/
// Nano-Banana examples, none of which are in this catalog: the ids below
// are the ones whose own label/description says "pro"/flagship/"quality".
// These two buckets are the least-grounded numbers in this file — if a real
// per-image cost ever lands, split them per model like the video table
// above rather than nudging the buckets.
const QUALITY_IMAGE_MODELS = new Set([
  "recraft/recraftv4-1-pro",
  "bytedance/seedream-5-pro",
  "xai/grok-imagine-image-quality",
  "openai/gpt-image-2",
  "google/nano-banana-pro",
]);
const FAST_IMAGE_COST_USD = 0.01;
const QUALITY_IMAGE_COST_USD = 0.05;

// Seedance 2.5 at 1080p routes to kie.ai instead of Cloudflare — Cloudflare's
// integration can't serve it. Real kie.ai per-second cost (dashboard,
// 2026-08-18): 1080p, no reference video, $0.570/s. Every other Seedance 2.5
// request stays on Cloudflare and uses the table above — this branch must
// keep matching usesKieAi() in generation-runner.ts, which routes on
// resolution alone, or we'd quote against a provider we don't actually use.
const SEEDANCE25_KIE_AI_1080P_COST_USD = 0.57;

function cheapestPerSecond(rates: Record<string, number>): number {
  return Math.min(...Object.values(rates));
}

export function estimateVideoCredits(
  model: string,
  durationSeconds: number,
  resolution: VideoResolution | string,
  options: { hasReferenceVideo?: boolean } = {},
) {
  const effectiveDuration =
    durationSeconds === -1 ? LIVE_VIDEO_AUTO_DURATION_ESTIMATE : durationSeconds;

  if (model === SEEDANCE_MODEL_ID && resolution === "1080p") {
    return Math.max(
      creditsFor(SEEDANCE_DURATION_MIN, SEEDANCE25_KIE_AI_1080P_COST_USD),
      creditsFor(effectiveDuration, SEEDANCE25_KIE_AI_1080P_COST_USD),
    );
  }

  // A model in the catalog but missing from VIDEO_COST_USD used to throw
  // here ("cannot read properties of undefined"), which surfaced as a 500 on
  // the generate endpoints and blocked the model entirely rather than just
  // mispricing it. Fall back to the Seedance 2.0 table — the reference costs
  // every other entry is scaled from — so a pricing gap can't take a model
  // offline again.
  const entry = VIDEO_COST_USD[model] ?? VIDEO_COST_USD[SEEDANCE2_MODEL_ID];
  const useVideoRates = options.hasReferenceVideo && entry.withReferenceVideo;
  const rates = useVideoRates ? entry.withReferenceVideo! : entry.perSecond;
  const minSeconds = useVideoRates
    ? (entry.minSecondsWithReferenceVideo ?? entry.minSeconds)
    : entry.minSeconds;
  const perSecond = rates[resolution] ?? Math.max(...Object.values(rates));
  return Math.max(
    creditsFor(minSeconds, cheapestPerSecond(rates)),
    creditsFor(effectiveDuration, perSecond),
  );
}

export function estimateImageCredits(model: string) {
  const costUsd = QUALITY_IMAGE_MODELS.has(model) ? QUALITY_IMAGE_COST_USD : FAST_IMAGE_COST_USD;
  return creditsFor(1, costUsd);
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
