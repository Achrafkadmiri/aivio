// Duplicated in aiVideo-backend/src/lib/cloudflare-models.ts and
// aiVideo-backend/supabase/functions/api/lib/cloudflare-models.ts — keep all three in sync.
// Config-driven registry for the Cloudflare Workers AI models that get a
// *generic* real-API integration (as opposed to the two bespoke Seedance
// 2.5/2.0 forms). Each entry describes a model's tunable fields well enough
// for:
//   - src/components/generate/dynamic-model-form.tsx to render a form
//   - src/lib/validation.ts's buildDynamicSchema() to validate it
//   - src/lib/generation-runner.ts's runCloudflareJob()
//     to build the exact Cloudflare `input` object and extract the result
//
// EVERY id, field name and enum below was verified live against
// POST /accounts/{id}/ai/run on 2026-08-29 by submitting a deliberately
// invalid field, which makes the API answer with the model's real field
// list and enum options without executing (and so without billing) the
// model. Do not "tidy" these values from memory or from docs — re-probe.
//
// Deliberately excluded: the 6 FLUX.2 models (multipart/form-data + binary
// uploads), the 5 async job-polling models (RunwayML/Vidu/PixVerse), and
// hh1.1-r2v (needs 1-9 reference images, no multi-upload UI yet).
//
// Also excluded because the REST /ai/run endpoint physically cannot return
// their output — both answer `{"result":{}}` no matter what `Accept` header
// is sent, since they stream a raw image that only the Workers
// `env.AI.run()` binding can surface: @cf/leonardo/phoenix-1.0 and
// @cf/stabilityai/stable-diffusion-xl-base-1.0. They were previously listed
// here under bare (prefix-less) ids that 404'd, so they never worked.

export type DynamicFieldType = "text" | "number" | "select" | "switch";

export type DynamicField = {
  /** camelCase key used in our form state / saved generation parameters. */
  key: string;
  /** Exact Cloudflare input param name this maps to. */
  cfParam: string;
  label: string;
  type: DynamicFieldType;
  /** For "select" fields. */
  options?: readonly string[];
  defaultValue?: string | number | boolean;
  /** For "number" fields. */
  min?: number;
  max?: number;
  helperText?: string;
  /** Translates our canonical value to the exact wire value the provider
   *  wants, for the models whose enum spelling differs from ours (Alibaba
   *  wants "720P"; FLUX 3 Video calls the same tiers "hd"/"fhd"). Keeping
   *  our own value canonical and lowercase matters: credit-estimate.ts
   *  keys its per-second rate tables on "720p"/"1080p", so storing the
   *  provider's spelling would silently miss the rate lookup and bill the
   *  most expensive tier. */
  cfValueMap?: Record<string, string | number | boolean>;
};

export type CloudflareModelConfig = {
  /** Exact Cloudflare model id, e.g. "recraft/recraftv4-1". First-party
   *  models need the "@cf/" prefix; partner models must NOT have it. */
  id: string;
  label: string;
  provider: string;
  description: string;
  category: "text-to-image" | "text-to-video" | "image-to-video";
  promptRequired: boolean;
  image: "none" | "optional" | "required";
  imageCfParam?: string;
  /** grok wants `{ url }` (its schema calls the field `image.url`), veo-3.1
   *  wants a raw base64-encoded image (fetched and re-encoded server-side,
   *  see generation-runner.ts), most others want a bare URL string. */
  imageParamShape?: "string" | "urlObject" | "base64";
  /** Extra tunable params exposed in the dynamic form. */
  fields: DynamicField[];
  /** Params always sent as-is, not user-editable (e.g. a fixed operation). */
  staticParams?: Record<string, string | number | boolean>;
  /** Merged over staticParams when the request HAS an input image, and
   *  when it doesn't, respectively. FLUX 3 Video is a discriminated union
   *  on `mode`: "t2v" takes a prompt, "i2v" takes `keyframes` instead of
   *  `image`, and sending the wrong one is a 400. */
  imageStaticParams?: Record<string, string | number | boolean>;
  noImageStaticParams?: Record<string, string | number | boolean>;
  /** Some providers refuse to host the generated file and instead demand a
   *  URL to upload it to — xAI enforces exactly this for Grok video on
   *  Zero Data Retention teams ("ZDR teams must provide output.upload_url").
   *  When set, the runner mints a pre-signed R2 PUT URL, passes it under
   *  `{ [cfParam]: { [urlKey]: url } }`, and persists that object as the
   *  result instead of re-downloading one from the provider. */
  outputUploadTarget?: { cfParam: string; urlKey: string; contentType: string };
  /** Path into the response (relative to `json.result ?? json`, matching the
   *  existing runCloudflareVideoModel convention) where the result lives. */
  outputPath: string[];
  /** Tried if outputPath comes back empty — e.g. grok-imagine-image can
   *  return `images[0]` instead of `image` once `n` > 1. */
  fallbackOutputPath?: string[];
  outputKind: "url" | "base64";
  /** MIME type for the `data:` URI built from a base64 result. Lucid Origin
   *  returns JPEG bytes, not PNG. */
  outputMimeType?: string;
};

export const CLOUDFLARE_MODELS: CloudflareModelConfig[] = [
  // ---------- text-to-image ----------
  // Verified field list: prompt, size, style, substyle, controls.colors,
  // controls.background_color.rgb. There is NO `image` param — the previous
  // entry advertised image-to-image support that 400s.
  {
    id: "recraft/recraftv4-1",
    label: "Recraft v4.1",
    provider: "Recraft",
    description: "Real Cloudflare Workers AI model — fast, cost-efficient with style controls",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "size", cfParam: "size", label: "Size", type: "text", defaultValue: "1024x1024", helperText: "e.g. 1024x1024" },
      { key: "style", cfParam: "style", label: "Style", type: "text", helperText: "Optional visual style" },
      { key: "substyle", cfParam: "substyle", label: "Substyle", type: "text", helperText: "Optional sub-style variant" },
    ],
    outputPath: ["image"],
    outputKind: "url",
  },
  {
    id: "recraft/recraftv4-1-pro",
    label: "Recraft v4.1 Pro",
    provider: "Recraft",
    description: "Real Cloudflare Workers AI model — high-resolution 2048px+ output",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "size", cfParam: "size", label: "Size", type: "text", defaultValue: "2048x2048", helperText: "e.g. 2048x2048" },
      { key: "style", cfParam: "style", label: "Style", type: "text", helperText: "Optional visual style" },
      { key: "substyle", cfParam: "substyle", label: "Substyle", type: "text", helperText: "Optional sub-style variant" },
    ],
    outputPath: ["image"],
    outputKind: "url",
  },
  {
    id: "recraft/recraftv4-1-vector",
    label: "Recraft v4.1 Vector",
    provider: "Recraft",
    description: "Real Cloudflare Workers AI model — production-ready SVG vector graphics",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "size", cfParam: "size", label: "Size", type: "text", defaultValue: "1024x1024", helperText: "e.g. 1024x1024" },
      { key: "style", cfParam: "style", label: "Style", type: "text", helperText: "Optional visual style" },
      { key: "substyle", cfParam: "substyle", label: "Substyle", type: "text", helperText: "Optional sub-style variant" },
    ],
    outputPath: ["image"],
    outputKind: "url",
  },
  // First-party model: needs the "@cf/" prefix (the bare id 404s with
  // "Model not found"). Returns base64 JPEG bytes at result.image, not a URL.
  {
    id: "@cf/leonardo/lucid-origin",
    label: "Lucid Origin",
    provider: "Leonardo",
    description: "Real Cloudflare Workers AI model — highly adaptable and prompt-responsive",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [],
    outputPath: ["image"],
    outputKind: "base64",
    outputMimeType: "image/jpeg",
  },
  {
    id: "google/nano-banana-2-lite",
    label: "Nano Banana 2 Lite",
    provider: "Google",
    description: "Real Cloudflare Workers AI model — Google's fastest Gemini image generation model",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [],
    outputPath: ["image"],
    outputKind: "url",
  },
  {
    id: "google/nano-banana-pro",
    label: "Nano Banana Pro",
    provider: "Google",
    description: "Real Cloudflare Workers AI model — Google's highest-fidelity Gemini image model",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [],
    outputPath: ["image"],
    outputKind: "url",
  },
  // Verified live: returns a URL at result.result.image.
  {
    id: "openai/gpt-image-2",
    label: "GPT Image 2",
    provider: "OpenAI",
    description: "Real Cloudflare Workers AI model — OpenAI's image model with quality tiers",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "size", cfParam: "size", label: "Size", type: "select", options: ["1024x1024", "1024x1536", "1536x1024", "auto"], defaultValue: "1024x1024" },
      { key: "quality", cfParam: "quality", label: "Quality", type: "select", options: ["low", "medium", "high", "auto"], defaultValue: "medium" },
    ],
    outputPath: ["image"],
    fallbackOutputPath: ["images", "0"],
    outputKind: "url",
  },
  {
    id: "xai/grok-imagine-image",
    label: "Grok Imagine",
    provider: "xAI",
    description: "Real Cloudflare Workers AI model — configurable aspect ratio and resolution",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "n", cfParam: "n", label: "Number of images", type: "number", defaultValue: 1, min: 1, max: 4 },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "text", helperText: "e.g. 16:9" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "text", helperText: "e.g. 1024x1024" },
    ],
    staticParams: { response_format: "url" },
    outputPath: ["image"],
    fallbackOutputPath: ["images", "0"],
    outputKind: "url",
  },
  // Its schema names the image field `image.url`, i.e. a nested { url }
  // object — a bare string 400s.
  {
    id: "xai/grok-imagine-image-quality",
    label: "Grok Imagine Quality",
    provider: "xAI",
    description: "Real Cloudflare Workers AI model — higher-fidelity, supports image editing",
    category: "text-to-image",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    imageParamShape: "urlObject",
    fields: [
      { key: "n", cfParam: "n", label: "Number of images", type: "number", defaultValue: 1, min: 1, max: 4 },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "text", helperText: "e.g. 16:9" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "text", defaultValue: "2k", helperText: "e.g. 2k" },
    ],
    staticParams: { response_format: "url" },
    outputPath: ["image"],
    fallbackOutputPath: ["images", "0"],
    outputKind: "url",
  },

  // ---------- text-to-video (no required image) ----------
  // Verified enum: resolution is "480p"|"720p" only — the 1080p option this
  // entry used to offer is not accepted by the model.
  {
    id: "bytedance/seedance-2.0-mini",
    label: "Seedance 2.0 Mini",
    provider: "ByteDance",
    description: "Real Cloudflare Workers AI model — compact & cost-efficient",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 4, max: 12, helperText: "seconds" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["480p", "720p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"], defaultValue: "16:9" },
      { key: "cameraFixed", cfParam: "camera_fixed", label: "Fix camera position", type: "switch", defaultValue: false },
      { key: "generateAudio", cfParam: "generate_audio", label: "Generate audio", type: "switch", defaultValue: false },
      { key: "watermark", cfParam: "watermark", label: "Watermark", type: "switch", defaultValue: false },
      { key: "useVirtualAvatar", cfParam: "use_virtual_avatar", label: "Virtual avatar mode", type: "switch", defaultValue: false },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
  // Discriminated union on `mode`: "t2v" (prompt) vs "i2v" (keyframes).
  // It calls the resolution tiers "hd"/"fhd", rejects `seed` outright, and
  // its aspect_ratio list has "auto"/"2:1" but no "9:21".
  {
    id: "black-forest-labs/flux-3-video",
    label: "Flux 3 Video",
    provider: "Black Forest Labs",
    description: "Real Cloudflare Workers AI model — first FLUX video model, native audio",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "keyframes",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 5, max: 20, helperText: "seconds" },
      {
        key: "resolution",
        cfParam: "resolution",
        label: "Resolution",
        type: "select",
        options: ["720p", "1080p"],
        defaultValue: "720p",
        cfValueMap: { "720p": "hd", "1080p": "fhd" },
      },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["auto", "21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"], defaultValue: "16:9" },
      { key: "generateAudio", cfParam: "generate_audio", label: "Generate audio", type: "switch", defaultValue: true },
      { key: "draft", cfParam: "draft", label: "Draft mode (fast preview)", type: "switch", defaultValue: false },
    ],
    noImageStaticParams: { mode: "t2v" },
    imageStaticParams: { mode: "i2v" },
    outputPath: ["video"],
    outputKind: "url",
  },
  // The operation discriminator is `_operation` (leading underscore), not
  // `operation` — the old spelling was rejected as an unsupported field.
  {
    id: "xai/grok-imagine-video",
    label: "Grok Imagine Video",
    provider: "xAI",
    description: "Real Cloudflare Workers AI model — native synchronized audio",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    imageParamShape: "urlObject",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 1, max: 15, helperText: "seconds" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], defaultValue: "16:9" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["480p", "720p"], defaultValue: "720p" },
    ],
    staticParams: { _operation: "generate" },
    outputUploadTarget: { cfParam: "output", urlKey: "upload_url", contentType: "video/mp4" },
    outputPath: ["video"],
    outputKind: "url",
  },
  {
    id: "xai/grok-imagine-video-1.5-preview",
    label: "Grok Imagine Video 1.5 Preview",
    provider: "xAI",
    description: "Real Cloudflare Workers AI model — next-gen quality improvements",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    imageParamShape: "urlObject",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 1, max: 15, helperText: "seconds" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], defaultValue: "16:9" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["480p", "720p"], defaultValue: "720p" },
    ],
    staticParams: { _operation: "generate" },
    outputUploadTarget: { cfParam: "output", urlKey: "upload_url", contentType: "video/mp4" },
    outputPath: ["video"],
    outputKind: "url",
  },
  // Verified as already correct: prompt, image_input, duration ("4s"/"6s"/
  // "8s"), aspect_ratio, resolution, generate_audio.
  {
    id: "google/veo-3.1",
    label: "Veo 3.1",
    provider: "Google",
    description: "Real Cloudflare Workers AI model — Google's flagship video model, native audio & zero data retention",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image_input",
    imageParamShape: "base64",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "select", options: ["4s", "6s", "8s"], defaultValue: "6s" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["16:9", "9:16", "1:1"], defaultValue: "16:9" },
      { key: "generateAudio", cfParam: "generate_audio", label: "Generate audio", type: "switch", defaultValue: true },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
  {
    id: "google/veo-3.1-fast",
    label: "Veo 3.1 Fast",
    provider: "Google",
    description: "Real Cloudflare Workers AI model — lower-latency Veo variant, same quality & native audio",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image_input",
    imageParamShape: "base64",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "select", options: ["4s", "6s", "8s"], defaultValue: "6s" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["16:9", "9:16", "1:1"], defaultValue: "16:9" },
      { key: "generateAudio", cfParam: "generate_audio", label: "Generate audio", type: "switch", defaultValue: true },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },

  // MiniMax's schema: duration is a 6|10 enum rather than a range, the
  // resolution tiers are spelled with a capital P, and additionalProperties
  // is false — anything not listed here is a hard 400. We keep our own
  // values canonical ("6", "768p") and translate on the wire, so the credit
  // rate table still matches.
  //
  // Its declared output is { task_id, status?, video? } with only task_id
  // required — the shape of an async job API. Should Cloudflare ever answer
  // before the render finishes, runCloudflareModel surfaces that status
  // verbatim rather than a generic "no result" error.
  {
    id: "minimax/hailuo-2.3",
    label: "Hailuo 2.3",
    provider: "MiniMax",
    description: "Real Cloudflare Workers AI model — MiniMax Hailuo 2.3, 6s or 10s at up to 1080p",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "first_frame_image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "select", options: ["6", "10"], defaultValue: "6", helperText: "seconds", cfValueMap: { "6": 6, "10": 10 } },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["768p", "1080p"], defaultValue: "768p", cfValueMap: { "768p": "768P", "1080p": "1080P" } },
      { key: "promptOptimizer", cfParam: "prompt_optimizer", label: "Optimize prompt", type: "switch", defaultValue: true },
      { key: "fastPretreatment", cfParam: "fast_pretreatment", label: "Fast pretreatment", type: "switch", defaultValue: false },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },

  // ---------- image-to-video (image required) ----------
  // Both Alibaba models share one schema: image, prompt, negative_prompt,
  // resolution, duration, seed, watermark. They have NO aspect_ratio (the
  // old entry sent one, which is what 400'd every request), and spell the
  // resolution tiers with a capital P.
  {
    id: "alibaba/hh1.1-i2v",
    label: "HappyHorse 1.1 — Live",
    provider: "Alibaba",
    description: "Real Cloudflare Workers AI model — smoother motion, improved close-ups",
    category: "image-to-video",
    promptRequired: false,
    image: "required",
    imageCfParam: "image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 3, max: 15, helperText: "seconds" },
      {
        key: "resolution",
        cfParam: "resolution",
        label: "Resolution",
        type: "select",
        options: ["720p", "1080p"],
        defaultValue: "720p",
        cfValueMap: { "720p": "720P", "1080p": "1080P" },
      },
      { key: "negativePrompt", cfParam: "negative_prompt", label: "Negative prompt", type: "text", helperText: "What to avoid" },
      { key: "watermark", cfParam: "watermark", label: "Watermark", type: "switch", defaultValue: false },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
  {
    id: "alibaba/wan-2.7-i2v",
    label: "Wan 2.7",
    provider: "Alibaba",
    description: "Real Cloudflare Workers AI model — Wan 2.7 image-to-video",
    category: "image-to-video",
    promptRequired: false,
    image: "required",
    imageCfParam: "image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 3, max: 15, helperText: "seconds" },
      {
        key: "resolution",
        cfParam: "resolution",
        label: "Resolution",
        type: "select",
        options: ["720p", "1080p"],
        defaultValue: "720p",
        cfValueMap: { "720p": "720P", "1080p": "1080P" },
      },
      { key: "negativePrompt", cfParam: "negative_prompt", label: "Negative prompt", type: "text", helperText: "What to avoid" },
      { key: "watermark", cfParam: "watermark", label: "Watermark", type: "switch", defaultValue: false },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
];

export function getCloudflareModel(id: string): CloudflareModelConfig | undefined {
  return CLOUDFLARE_MODELS.find((m) => m.id === id);
}
