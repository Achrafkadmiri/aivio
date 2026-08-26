// DUPLIQUÉ dans aiVideo-backend/src/lib/cloudflare-models.ts — garder synchronisé.
// Config-driven registry for the Cloudflare Workers AI models that get a
// *generic* real-API integration (as opposed to the two bespoke Seedance
// 2.5/2.0 forms) — see cloudflare_ai_models_reference.md. Each entry
// describes a model's tunable fields well enough for:
//   - src/components/generate/dynamic-model-form.tsx to render a form
//   - src/lib/validation.ts's buildDynamicSchema() to validate it
//   - src/lib/generation-engine.ts's runRealCloudflareGenericGeneration()
//     to build the exact Cloudflare `input` object and extract the result
//
// Deliberately excludes (and so does the model catalog in constants.ts,
// which only lists models present in this registry): the 6 FLUX.2 models
// (multipart/form-data + binary image uploads), the 5 async job-polling
// models (RunwayML/Vidu/PixVerse), and hh1.1-r2v (requires 1-9 reference
// images, no multi-upload UI yet). Wire those up here first if they're
// ever added back to the catalog.

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
};

export type CloudflareModelConfig = {
  /** Exact Cloudflare model id, e.g. "  recraft/recraftv4-1". */
  id: string;
  label: string;
  provider: string;
  description: string;
  category: "text-to-image" | "text-to-video" | "image-to-video";
  promptRequired: boolean;
  image: "none" | "optional" | "required";
  imageCfParam?: string;
  /** grok-imagine-video wants `{ url }`, veo-3.1 wants a raw base64-encoded
   *  image (fetched and re-encoded server-side, see generation-engine.ts),
   *  most others want a bare URL string. */
  imageParamShape?: "string" | "urlObject" | "base64";
  /** Extra tunable params exposed in the dynamic form. */
  fields: DynamicField[];
  /** Params always sent as-is, not user-editable (e.g. a fixed `operation`). */
  staticParams?: Record<string, string | number | boolean>;
  /** Path into the response (relative to `json.result ?? json`, matching the
   *  existing runCloudflareVideoModel convention) where the result lives. */
  outputPath: string[];
  /** Tried if outputPath comes back empty — e.g. grok-imagine-image can
   *  return `images[0]` instead of `image` once `n` > 1. */
  fallbackOutputPath?: string[];
  outputKind: "url" | "base64";
};

export const CLOUDFLARE_MODELS: CloudflareModelConfig[] = [
  // ---------- text-to-image ----------
  {
    id: "recraft/recraftv4-1",
    label: "Recraft v4.1",
    provider: "Recraft",
    description: "Real Cloudflare Workers AI model — fast, cost-efficient with style controls",
    category: "text-to-image",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
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
    image: "optional",
    imageCfParam: "image",
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
    image: "optional",
    imageCfParam: "image",
    fields: [
      { key: "size", cfParam: "size", label: "Size", type: "text", defaultValue: "1024x1024", helperText: "e.g. 1024x1024" },
      { key: "style", cfParam: "style", label: "Style", type: "text", helperText: "Optional visual style" },
      { key: "substyle", cfParam: "substyle", label: "Substyle", type: "text", helperText: "Optional sub-style variant" },
    ],
    outputPath: ["image"],
    outputKind: "url",
  },
  {
    id: "leonardo/lucid-origin",
    label: "Lucid Origin",
    provider: "Leonardo",
    description: "Real Cloudflare Workers AI model — highly adaptable and prompt-responsive",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [],
    outputPath: ["image"],
    outputKind: "url",
  },
  {
    id: "leonardo/phoenix-1.0",
    label: "Phoenix 1.0",
    provider: "Leonardo",
    description: "Real Cloudflare Workers AI model — exceptional prompt adherence and coherent text",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [],
    outputPath: ["image"],
    outputKind: "url",
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
  // Confirmed via Cloudflare's own model docs (developers.cloudflare.com/ai/
  // models/google/nano-banana-pro/, checked 2026-08-26): id, input schema
  // (prompt/aspect_ratio/output_format/image_size/image — image_input is an
  // array field the dynamic form doesn't support yet, same reason the FLUX.2
  // models are excluded above) and output schema (`result.image`, a URL) all
  // match this registry's existing generic-model conventions exactly.
  // Frontend-only for now — the Cloudflare Workers AI call itself runs in
  // the separate aiVideo-backend repo, which needs this same entry (plus its
  // Supabase Edge Function mirror) added before a real generation will
  // succeed; until then this card routes to /generate but the request fails
  // server-side.
  {
    id: "google/nano-banana-pro",
    label: "Nano Banana Pro",
    provider: "Google",
    description: "Real Cloudflare Workers AI model — Google's higher-quality image model, 4K output & improved detail",
    category: "text-to-image",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    fields: [
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"], defaultValue: "1:1" },
      { key: "imageSize", cfParam: "image_size", label: "Resolution", type: "select", options: ["1K", "2K", "4K"], defaultValue: "1K" },
      { key: "outputFormat", cfParam: "output_format", label: "Output format", type: "select", options: ["jpg", "png", "webp"], defaultValue: "png" },
    ],
    outputPath: ["image"],
    outputKind: "url",
  },
  // Confirmed via Cloudflare's own model docs (developers.cloudflare.com/ai/
  // models/openai/gpt-image-2/, checked 2026-08-26): id, input schema
  // (prompt/quality/size/background/output_format — `images`, the edit-input
  // field, is an array of up to 16 base64 images the dynamic form doesn't
  // support yet, same reason the FLUX.2 models are excluded above, so this
  // is text-to-image only here) and output schema (`result.image`, a URL)
  // all match this registry's existing generic-model conventions. Same
  // frontend-only caveat as Nano Banana Pro above — needs the matching
  // aiVideo-backend entry before a real generation will succeed.
  {
    id: "openai/gpt-image-2",
    label: "GPT Image 2",
    provider: "OpenAI",
    description: "Real Cloudflare Workers AI model — OpenAI's flagship image model, precise text rendering & photorealism",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "quality", cfParam: "quality", label: "Quality", type: "select", options: ["low", "medium", "high", "auto"], defaultValue: "auto" },
      { key: "size", cfParam: "size", label: "Size", type: "select", options: ["1024x1024", "1024x1536", "1536x1024", "auto"], defaultValue: "auto" },
      { key: "background", cfParam: "background", label: "Background", type: "select", options: ["transparent", "opaque", "auto"], defaultValue: "auto" },
      { key: "outputFormat", cfParam: "output_format", label: "Output format", type: "select", options: ["png", "webp", "jpeg"], defaultValue: "png" },
    ],
    outputPath: ["image"],
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
  {
    id: "xai/grok-imagine-image-quality",
    label: "Grok Imagine Quality",
    provider: "xAI",
    description: "Real Cloudflare Workers AI model — higher-fidelity, supports image editing",
    category: "text-to-image",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
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
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    label: "Stable Diffusion XL 1.0",
    provider: "Stability AI (Cloudflare)",
    description: "Real Cloudflare Workers AI model — width/height/steps control",
    category: "text-to-image",
    promptRequired: true,
    image: "none",
    fields: [
      { key: "width", cfParam: "width", label: "Width", type: "number", defaultValue: 1024, min: 256, max: 2048 },
      { key: "height", cfParam: "height", label: "Height", type: "number", defaultValue: 1024, min: 256, max: 2048 },
      { key: "numSteps", cfParam: "num_steps", label: "Inference steps", type: "number", defaultValue: 20, min: 1, max: 50 },
      { key: "guidance", cfParam: "guidance", label: "Guidance scale", type: "number", defaultValue: 7.5, min: 0, max: 20 },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["image"],
    outputKind: "base64",
  },

  // ---------- text-to-video (no required image) ----------
  {
    id: "bytedance/seedance-2.0-mini",
    label: "Seedance 2.0 Mini",
    provider: "ByteDance",
    description: "Real Cloudflare Workers AI model — compact & cost-efficient, up to 1080p",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 4, max: 12, helperText: "seconds" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["480p", "720p", "1080p"], defaultValue: "720p" },
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
  {
    id: "black-forest-labs/flux-3-video",
    label: "Flux 3 Video",
    provider: "Black Forest Labs",
    description: "Real Cloudflare Workers AI model — first FLUX video model, native audio",
    category: "text-to-video",
    promptRequired: true,
    image: "optional",
    imageCfParam: "image",
    fields: [
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 5, max: 20, helperText: "seconds" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "9:21"], defaultValue: "16:9" },
      { key: "generateAudio", cfParam: "generate_audio", label: "Generate audio", type: "switch", defaultValue: true },
      { key: "draft", cfParam: "draft", label: "Draft mode (fast preview)", type: "switch", defaultValue: false },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
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
    staticParams: { operation: "generate" },
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
    staticParams: { operation: "generate" },
    outputPath: ["video"],
    outputKind: "url",
  },
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

  // ---------- image-to-video (image required) ----------
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
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["16:9", "9:16", "4:3", "1:1"], defaultValue: "16:9" },
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
      { key: "duration", cfParam: "duration", label: "Duration", type: "number", defaultValue: 5, min: 2, max: 15, helperText: "seconds" },
      { key: "resolution", cfParam: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p"], defaultValue: "720p" },
      { key: "aspectRatio", cfParam: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["16:9", "9:16", "4:3", "1:1"], defaultValue: "16:9" },
      { key: "seed", cfParam: "seed", label: "Seed", type: "number" },
    ],
    outputPath: ["video"],
    outputKind: "url",
  },
];

export function getCloudflareModel(id: string): CloudflareModelConfig | undefined {
  return CLOUDFLARE_MODELS.find((m) => m.id === id);
}
