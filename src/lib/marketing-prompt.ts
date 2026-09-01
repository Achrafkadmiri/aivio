// Turns the Marketing Studio's brief (what you're selling, who's in it, what
// it should say) plus the picked style into the single string that actually
// gets submitted.
//
// Everything here is prompt text, on purpose. The backend builds a
// generation's parameters strictly from the model registry, so "product",
// "talent" and "headline" have nowhere else to go — same constraint
// image-styles.ts documents for its style presets. The one thing that IS
// structured is the reference image, and even that is a single slot
// (`inputImageUrl`), which is why the sheet note below has to exist at all.

import type { MarketingKind, MarketingStyle } from "@/lib/marketing-styles";

export type MarketingBrief = {
  /** "Aurelia Night Serum" */
  productName: string;
  /** "30ml amber glass dropper bottle, retinol serum" */
  productDetails: string;
  /** Who appears in the shot, when anyone does. */
  talent: string;
  /** Text to render into the image — a claim, an offer, a price. */
  headline: string;
  /** Anything the style and the brief don't already cover. */
  extra: string;
};

export const EMPTY_BRIEF: MarketingBrief = {
  productName: "",
  productDetails: "",
  talent: "",
  headline: "",
  extra: "",
};

/**
 * Which uploaded asset travels as the model's one reference image.
 *
 * `sheet` is the two-in-one case: product and talent composited side by side
 * into a single image (see reference-sheet.ts) because a generation carries
 * exactly one input image and the studio's whole premise needs two. It is
 * offered for image models only — on a video model the reference is the
 * opening frame, so a side-by-side sheet would literally be animated.
 */
export type ReferenceUse = "none" | "product" | "talent" | "sheet";

/** Hard cap on what we submit. The shared dynamic schema allows 2000
 *  characters (see buildDynamicSchema); staying under it keeps a long "extra
 *  direction" from turning into a validation error at submit time. */
const MAX_PROMPT_LENGTH = 1900;

function referenceNote(kind: MarketingKind, reference: ReferenceUse): string | undefined {
  if (reference === "none") return undefined;

  if (reference === "sheet") {
    return (
      "The attached reference is a two-panel identity sheet: the LEFT panel is the product, " +
      "the RIGHT panel is the person. Reproduce both faithfully — the product's exact shape, " +
      "proportions, label text and colours, and the person's face, hair and build — together in " +
      "one new scene. Do not reproduce the sheet itself: no split layout, no divider, no white " +
      "panel background."
    );
  }

  const subject =
    reference === "product"
      ? "the product in the attached reference exactly as it is — same shape, proportions, label text and colours"
      : "the person in the attached reference — same face, hair and build";

  return kind === "video"
    ? `The attached image is the opening frame. Keep ${subject} consistent for the whole clip, with no drift.`
    : `Keep ${subject}.`;
}

function subjectLine(kind: MarketingKind, brief: MarketingBrief, reference: ReferenceUse): string {
  const name = brief.productName.trim();
  const details = brief.productDetails.trim();
  const noun = kind === "video" ? "Advertising video" : "Advertising image";

  const subject = name
    ? details
      ? `${name} — ${details}`
      : name
    : details || (reference === "none" ? "the product" : "the product in the reference image");

  return `${noun} for ${subject}.`;
}

/** The catalog writes its directions as fragments ("studio product
 *  photography on a seamless backdrop, …") so they can also be read on a
 *  style card. Each one still lands mid-prompt as its own sentence. */
function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * The exact text submitted as `prompt`.
 *
 * Order matters: subject first (what this is selling), then who's in it, then
 * how the reference must be treated, then the style's own treatment, and only
 * then the copy and any freeform direction. Models weight the front of a
 * prompt most heavily, and the one thing a marketing shot cannot get wrong is
 * which product it's of.
 */
export function buildMarketingPrompt(
  style: MarketingStyle,
  brief: MarketingBrief,
  options: { kind: MarketingKind; reference: ReferenceUse },
): string {
  const { kind, reference } = options;
  const parts: string[] = [subjectLine(kind, brief, reference)];

  const talent = brief.talent.trim();
  if (talent) parts.push(`Featuring ${talent}.`);

  const note = referenceNote(kind, reference);
  if (note) parts.push(note);

  parts.push(`${sentence(style.direction)}.`);

  const headline = brief.headline.trim();
  if (headline) {
    parts.push(
      `Render the headline text "${headline}" exactly as written — correctly spelled, in a clean modern sans-serif, placed so it never covers the product.`,
    );
  }

  const extra = brief.extra.trim();
  if (extra) parts.push(sentence(extra).replace(/\s*\.?\s*$/, "."));

  const prompt = parts.join(" ");
  return prompt.length > MAX_PROMPT_LENGTH
    ? `${prompt.slice(0, MAX_PROMPT_LENGTH - 1).trimEnd()}…`
    : prompt;
}

/** Whether the brief says enough to be worth spending credits on. A style
 *  alone describes treatment, never subject — generating from it with no
 *  product attached or named produces a beautiful photo of nothing in
 *  particular, at full price. */
export function briefBlockedReason(
  brief: MarketingBrief,
  reference: ReferenceUse,
): string | undefined {
  if (reference !== "none") return undefined;
  if (brief.productName.trim() || brief.productDetails.trim()) return undefined;
  return "Add a product photo, or name the product in the brief.";
}
