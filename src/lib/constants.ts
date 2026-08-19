// DUPLIQUÉ dans aiVideo-backend/src/lib/constants.ts — garder synchronisé.
import { CLOUDFLARE_MODELS } from "@/lib/cloudflare-models";

export const TIERS = ["free", "starter", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

// Real-money value backing each credit, for display only (e.g. "this
// generation costs ~$0.045") — not used in any billing math, since payments
// are simulated (see api/subscription/upgrade). Paid tiers' monthlyCredits
// below are priceMonthly / CREDIT_VALUE_USD (rounded), so the credit
// allowance actually matches what the plan's price buys at this rate.
export const CREDIT_VALUE_USD = 0.009;

// Markup applied on top of Cloudflare's raw per-second Neuron cost before
// converting to credits (see LIVE_VIDEO_RATE in credit-estimate.ts) — covers
// overhead, the free tier's giveaway credits, and support costs.
export const PROVIDER_COST_MARGIN = 2;

export const TIER_INFO: Record<
  Tier,
  {
    label: string;
    priceMonthly: number | null; // null = "contact sales"
    monthlyCredits: number | null; // null = unlimited
    maxResolution: string;
    maxDurationSeconds: number;
    concurrentGenerations: number;
    features: string[];
  }
> = {
  free: {
    label: "Free",
    priceMonthly: 0,
    monthlyCredits: 10,
    maxResolution: "720p",
    maxDurationSeconds: 5,
    concurrentGenerations: 1,
    features: [
      "10 credits / month",
      "720p max resolution",
      "5s max video length",
      "Community gallery",
    ],
  },
  starter: {
    label: "Starter",
    priceMonthly: 9.99,
    monthlyCredits: 1110, // 9.99 / CREDIT_VALUE_USD
    maxResolution: "1080p",
    maxDurationSeconds: 15,
    concurrentGenerations: 2,
    features: [
      "1,110 credits / month",
      "1080p max resolution",
      "15s max video length",
      "No watermark",
      "Private gallery",
    ],
  },
  pro: {
    label: "Pro",
    priceMonthly: 29.99,
    monthlyCredits: 3332, // round(29.99 / CREDIT_VALUE_USD)
    maxResolution: "1080p",
    maxDurationSeconds: 20,
    concurrentGenerations: 5,
    features: [
      "3,332 credits / month",
      "All resolutions & frame rates",
      "Priority queue",
      "Advanced analytics",
    ],
  },
  enterprise: {
    label: "Enterprise",
    priceMonthly: null,
    monthlyCredits: null,
    maxResolution: "1080p",
    maxDurationSeconds: 20,
    concurrentGenerations: 20,
    features: [
      "Unlimited generations",
      "Dedicated infrastructure",
      "Custom model fine-tuning",
      "99.9% SLA",
    ],
  },
};

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
