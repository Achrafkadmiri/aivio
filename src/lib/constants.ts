// DUPLIQUÉ dans aiVideo-backend/src/lib/constants.ts (et son miroir Deno
// supabase/functions/api/lib/constants.ts) — garder synchronisé.
import { CLOUDFLARE_MODELS } from "@/lib/cloudflare-models";

// Real-money value backing each credit ($0.01 = 1 credit), for display (e.g.
// "this generation costs ~$0.45") AND as the actual conversion rate used to
// price every generation in credit-estimate.ts (credits/s = round(rateUsd /
// CREDIT_VALUE_USD)) — i.e. a generation's credit cost tracks its real infra
// cost 1:1, no markup. Margin instead comes from each tier granting fewer
// credits than its price would buy at this rate (see TIER_INFO comments) —
// see the "Plan Tarifaire Créateur" pricing artifact this was modeled on.
export const CREDIT_VALUE_USD = 0.01;

export const TIERS = ["free", "starter", "creator", "studio"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_INFO: Record<
  Tier,
  {
    label: string;
    priceMonthly: number;
    monthlyCredits: number;
    maxResolution: string;
    maxDurationSeconds: number;
    concurrentGenerations: number;
    // Extra months a monthly grant stays spendable after the month it was
    // granted in — 0 = expires at month end, 1 = "1-month rollover".
    rolloverMonths: number;
    videoWatermark: boolean;
    commercialLicense: boolean;
    seats: number;
    priorityQueue: boolean;
    apiAccess: boolean;
    features: string[];
  }
> = {
  // Credits/prices recalibrated 2026-08-25 ("Plan Tarifaire Créateur v2") so
  // every paid tier clears a 40% NET margin (credits at CREDIT_VALUE_USD +
  // ~2.9%+$0.30 Stripe fee + ~5% overhead for storage/support/hosting), not
  // just a 40%+ margin on raw credit cost. maxResolution/maxDurationSeconds/
  // concurrentGenerations/videoWatermark/priorityQueue/apiAccess are enforced
  // server-side (see aiVideo-backend's generations.ts).
  free: {
    label: "Découverte",
    priceMonthly: 0,
    monthlyCredits: 50,
    // Capped at 480p (not 720p): a 5s 720p clip costs 75-115 credits,
    // more than the entire free budget — 480p is the only resolution a
    // free user can actually afford one real clip in.
    maxResolution: "480p",
    maxDurationSeconds: 5,
    concurrentGenerations: 1,
    rolloverMonths: 0,
    videoWatermark: true,
    commercialLicense: false,
    seats: 1,
    priorityQueue: false,
    apiAccess: false,
    features: [
      "50 credits / month",
      "~50 Nano Banana images",
      "~5s Seedance 2.5 video (480p)",
      "Video watermark",
      "Standard queue",
    ],
  },
  starter: {
    label: "Starter",
    priceMonthly: 9.99,
    monthlyCredits: 480,
    maxResolution: "1080p",
    maxDurationSeconds: 20,
    concurrentGenerations: 2,
    rolloverMonths: 0,
    videoWatermark: false,
    commercialLicense: true,
    seats: 1,
    priorityQueue: false,
    apiAccess: false,
    features: [
      "480 credits / month",
      "~480 Nano Banana images",
      "~21s Seedance 2.5 video (720p)",
      "Up to 1080p",
      "No watermark",
      "Commercial license",
      "Standard queue",
    ],
  },
  creator: {
    label: "Créateur",
    priceMonthly: 24,
    monthlyCredits: 1200,
    maxResolution: "1080p",
    maxDurationSeconds: 30,
    concurrentGenerations: 3,
    rolloverMonths: 1,
    videoWatermark: false,
    commercialLicense: true,
    seats: 1,
    priorityQueue: true,
    apiAccess: false,
    features: [
      "1,200 credits / month",
      "~1,200 Nano Banana images",
      "~52s Seedance 2.5 video (720p)",
      "Up to 1080p",
      "Priority queue",
      "Commercial license",
      "Unused credits roll over 1 month",
    ],
  },
  studio: {
    label: "Studio",
    priceMonthly: 49,
    monthlyCredits: 2450,
    // Only tier allowed to spend credits on 4K (Seedance 2.0) generations.
    maxResolution: "4k",
    maxDurationSeconds: 30,
    concurrentGenerations: 5,
    rolloverMonths: 1,
    videoWatermark: false,
    commercialLicense: true,
    seats: 3,
    priorityQueue: true,
    apiAccess: true,
    features: [
      "2,450 credits / month",
      "~2,450 Nano Banana images",
      "~106s Seedance 2.5 video (720p)",
      "~31s Seedance 2.0 video (4K, exclusive)",
      "Commercial license",
      "API access",
      "3 team seats",
      "Max priority queue",
    ],
  },
};

// Display-only annual-billing prices ("1 month free" ≈ 8.3% off monthly,
// pay 11 months for 12) — payments are simulated in this build, so this
// isn't wired to any real billing cycle. Kept intentionally more modest than
// a typical 17-20% annual discount: at the recalibrated monthlyCredits
// above, a deeper discount would push net margin below 40% (see "Plan
// Tarifaire Créateur v2").
export const ANNUAL_PRICE_MONTHLY: Partial<Record<Tier, number>> = {
  starter: 9.16,
  creator: 22,
  studio: 44.92,
};

// Pay-per-use top-ups — credits never expire (see grantRecharge in
// aiVideo-backend's credits.ts), unlike the monthly plan grants above.
export const RECHARGE_PACKS = [
  { id: "pack_500", credits: 500, priceUsd: 8.49 },
  { id: "pack_2000", credits: 2000, priceUsd: 33.49 },
  { id: "pack_5000", credits: 5000, priceUsd: 83.49 },
] as const;
export type RechargePackId = (typeof RECHARGE_PACKS)[number]["id"];

export const GENERATION_TYPES = [
  "text-to-video",
  "image-to-video",
  "text-to-image",
] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const GENERATION_STATUSES = [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

// Entries derived from the generic model registry (cloudflare-models.ts)
// instead of hand-duplicated here, so the catalog and the actual Cloudflare
// wiring can't drift out of sync.
const DYNAMIC_VIDEO_ENTRIES = CLOUDFLARE_MODELS.filter(
  (m) => m.category === "text-to-video" || m.category === "image-to-video",
).map((m) => ({
  id: m.id,
  label: m.label,
  provider: m.provider,
  description: m.description,
  live: true as const,
}));

const DYNAMIC_IMAGE_ENTRIES = CLOUDFLARE_MODELS.filter((m) => m.category === "text-to-image").map(
  (m) => ({
    id: m.id,
    label: m.label,
    provider: m.provider,
    description: m.description,
    live: true as const,
  }),
);

export const VIDEO_MODELS = [
  {
    id: "bytedance/seedance-2.5",
    label: "Seedance 2.5",
    provider: "ByteDance",
    description: "Real Cloudflare Workers AI model — up to 30s, reference control & audio",
    live: true,
  },
  {
    id: "bytedance/seedance-2.0",
    label: "Seedance 2.0",
    provider: "ByteDance",
    description: "Real Cloudflare Workers AI model — up to 4K, fixed camera & native audio",
    live: true,
  },
  ...DYNAMIC_VIDEO_ENTRIES,
] as const;
export type VideoModelId = (typeof VIDEO_MODELS)[number]["id"];

export const IMAGE_MODELS = [...DYNAMIC_IMAGE_ENTRIES] as const;
export type ImageModelId = (typeof IMAGE_MODELS)[number]["id"];

export const VIDEO_DURATIONS = [3, 5, 10, 15, 20] as const;
export const VIDEO_RESOLUTIONS = ["720p", "1080p"] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];
export const VIDEO_FPS = [24, 48] as const;
export const VIDEO_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "21:9"] as const;

export const IMAGE_RESOLUTIONS = [
  "512x512",
  "768x768",
  "1024x1024",
  "1536x1536",
] as const;
export type ImageResolution = (typeof IMAGE_RESOLUTIONS)[number];
export const IMAGE_ASPECT_RATIOS = ["1:1", "4:3", "16:9", "21:9"] as const;
export const IMAGE_STYLE_PRESETS = [
  "Photorealistic",
  "Oil Painting",
  "Anime",
  "Cartoon",
  "3D Render",
  "Sketch",
] as const;

export const MOTION_INTENSITIES = ["low", "medium", "high"] as const;
export const CAMERA_MOVEMENTS = ["none", "subtle", "dynamic"] as const;

// Seedance 2.5's own parameter set (confirmed via Cloudflare's input JSON
// schema, 2026-08-14) — deliberately separate from the generic
// VIDEO_DURATIONS/VIDEO_RESOLUTIONS/VIDEO_ASPECT_RATIOS above rather than
// merged, since the allowed values genuinely differ per model (e.g. 480p/
// 720p only, no 1080p; duration is a continuous 4-30 range plus -1 "auto").
export const SEEDANCE_MODEL_ID = "bytedance/seedance-2.5";
export const SEEDANCE_DURATION_MIN = 4;
export const SEEDANCE_DURATION_MAX = 30;
export const SEEDANCE_DURATION_AUTO = -1;
// 1080p isn't offered by Cloudflare's Seedance 2.5 integration — those
// requests (and any that attach a reference video) route to kie.ai instead,
// see SEEDANCE_MODEL_ID handling in generation-engine.ts.
export const SEEDANCE_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export const SEEDANCE_ASPECT_RATIOS = [
  "adaptive",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
] as const;
export const SEEDANCE_OUTPUT_FORMATS = ["mp4", "mov"] as const;

// Seedance 2.0's own parameter set (confirmed via the ByteDance/Cloudflare
// integration guide, 2026-08-14) — kept separate from the 2.5 constants
// above since the two models genuinely differ: no -1 "auto" duration, a
// wider resolution ceiling (up to 4K), a real camera_fixed toggle (2.5
// documents it as unsupported), and no output_format choice.
export const SEEDANCE2_MODEL_ID = "bytedance/seedance-2.0";
export const SEEDANCE2_DURATION_MIN = 4;
export const SEEDANCE2_DURATION_MAX = 12;
export const SEEDANCE2_RESOLUTIONS = ["480p", "720p", "1080p", "4k"] as const;
export const SEEDANCE2_ASPECT_RATIOS = [
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "9:21",
] as const;
