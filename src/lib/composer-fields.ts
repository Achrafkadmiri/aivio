// How the generate composer decides what to put in its toolbar.
//
// The model registry (cloudflare-models.ts) describes every parameter each
// model accepts, and the composer used to render all of them as equals — so
// an output-format picker sat next to the resolution, and a 15-model catalog
// meant the pill row's contents changed shape completely between models. This
// ranks them instead: a short, predictable set of pills carries the decisions
// that actually change the result (and the price), everything else falls
// through to the Settings panel where it stays reachable.

/**
 * Never rendered. The plan decides these, not the user.
 *
 * `watermark` is forced to true for the free tier server-side (see
 * aiVideo-backend's generations.ts) and false on every paid plan, so a toggle
 * here is a control that either lies or does nothing. Hiding it does not drop
 * the value: registry fields carrying a defaultValue are defaulted by the zod
 * schema on both sides, so omitting the key sends exactly what the visible
 * toggle would have sent.
 */
export const TIER_MANAGED_FIELD_KEYS: ReadonlySet<string> = new Set(["watermark"]);

/**
 * Fields promoted to toolbar pills, in the order they appear there. A field
 * only qualifies if it is also a fixed enum (or the duration range) — a
 * free-text `size` stays a text input in the panel, since a pill can't offer
 * a list it doesn't have.
 */
export const PRIMARY_FIELD_KEYS = [
  "duration",
  "resolution",
  "imageSize",
  "size",
  "quality",
  "aspectRatio",
] as const;

const PRIMARY_ORDER = new Map(PRIMARY_FIELD_KEYS.map((key, index) => [key as string, index]));

export function isPrimaryFieldKey(key: string): boolean {
  return PRIMARY_ORDER.has(key);
}

/** Sort comparator putting primary fields in PRIMARY_FIELD_KEYS order. */
export function comparePrimaryFieldKeys(a: string, b: string): number {
  return (PRIMARY_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER) - (PRIMARY_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER);
}

/**
 * Plain-language hint shown beside a raw enum value in a select.
 *
 * The registry's values are the provider's own spellings, verified live
 * against each model, and they are not interchangeable or even consistent
 * between models ("720P" vs "720p", "hd" vs "fhd"). They stay untouched in the
 * payload — this only annotates them in the list, so picking a resolution
 * doesn't require knowing that "fhd" means 1080p.
 */
const VALUE_HINTS: Record<string, string> = {
  // Video resolutions.
  "480p": "SD",
  "540p": "SD+",
  "720p": "HD",
  "768p": "HD+",
  "1080p": "Full HD",
  "4k": "Ultra HD",
  hd: "HD",
  fhd: "Full HD",
  // Image sizes. xAI spells its two tiers in lowercase, ByteDance in upper -
  // both are the provider's own spelling and neither is interchangeable.
  "1k": "~1024px",
  "2k": "~2048px",
  "1K": "~1024px",
  "2K": "~2048px",
  "3K": "~3072px",
  "4K": "~4096px",
  "512x512": "Square, fastest",
  "768x768": "Square",
  "1024x1024": "Square",
  "1024x1536": "Portrait",
  "1536x1024": "Landscape",
  "1536x1536": "Square, largest",
  "2048x2048": "Square, largest",
  // Quality / effort.
  low: "Fastest",
  medium: "Balanced",
  high: "Best quality",
  auto: "Model decides",
  // Aspect ratios worth naming.
  "16:9": "Landscape",
  "9:16": "Vertical",
  "1:1": "Square",
  "21:9": "Cinematic",
  "4:3": "Classic",
  "3:4": "Portrait",
  "4:5": "Portrait",
  "3:2": "Photo",
  "2:3": "Photo, portrait",
  "9:21": "Ultra vertical",
  "2:1": "Wide",
  "1:2": "Tall",
  "9:19.5": "Phone",
  "19.5:9": "Phone, landscape",
  "9:20": "Tall phone",
  "20:9": "Tall phone, landscape",
  "5:4": "Landscape",
  adaptive: "Match the reference",
  match_input_image: "Match the reference",
};

export function valueHint(value: string | number): string | undefined {
  return VALUE_HINTS[String(value)];
}
