// Real, publicly hosted example outputs from OpenAI's GPT Image 2 model —
// same sourcing/verification standard as nano-banana-showcase.ts, pulled
// from fal.ai's own GPT Image 2 model page (fal.ai/gpt-image-2), which
// re-hosts each example through its refinery.fal.media resize proxy (same
// `/tr:w-1920,q-80/name.webp` transform suffix already used by the Nano
// Banana entries below). Every URL curl-verified 200 OK with an image
// content-type on 2026-08-26. Frontend-only for now, like the GPT Image 2 /
// Nano Banana Pro catalog entries in cloudflare-models.ts — not yet added to
// aiVideo-backend's mirrored copies of the sibling showcase files.

export type GptImage2Image = {
  id: string;
  url: string;
  prompt: string;
};

export const GPT_IMAGE_2_IMAGES: GptImage2Image[] = [
  {
    id: "hero",
    url: "https://www.jxp.com/_next/image?url=https%3A%2F%2Fcysource.jxp.com%2Fhomepage%2Fgpt-image-case%2Fgpt-image-11.jpg&w=1080&q=75",
    prompt: "GPT Image 2 — state-of-the-art image generation",
  },
  {
    id: "text-rendering",
    url: "https://www.jxp.com/_next/image?url=https%3A%2F%2Fcysource.jxp.com%2Fhomepage%2Fgpt-image-case%2Fgpt-image-09.jpg&w=3840&q=75",
    prompt: "Production-ready text rendering — dense paragraphs, small lettering, and complex multilingual layouts",
  },
  {
    id: "photorealism",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fgpt-image-2%2Ffeature-2.png/tr:w-1920,q-80/feature-2.webp",
    prompt: "State-of-the-art realism — lighting, materials, skin textures, and environmental detail",
  },
  {
    id: "product-photography",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fgpt-image-2%2Ffeature-3.png/tr:w-1920,q-80/feature-3.webp",
    prompt: "Brand-consistent product photography — readable ingredient lists, correct colour palettes, precise logo reproduction",
  },
  {
    id: "photosynthesis-infographic",
    url: "https://www.jxp.com/_next/image?url=https%3A%2F%2Fcysource.jxp.com%2Fhomepage%2Fgpt-image-case%2Fgpt-image-16.jpg&w=1080&q=75",
    prompt:
      "A detailed scientific infographic of an integrated biohybrid artificial photosynthesis platform for solar-to-fuel conversion, with labeled cross-section diagrams, molecular structures, efficiency charts, and process flow annotations",
  },
  {
    id: "90s-hallway-portrait",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fgpt-image-2%2Fexample-2.png/tr:w-1920,q-80/example-2.webp",
    prompt:
      "A photorealistic 35mm film photograph of a teenage boy leaning against blue school lockers in a hallway, wearing a black Nirvana t-shirt with the smiley face logo and light wash jeans, natural fluorescent lighting, 1990s aesthetic",
  },
  {
    id: "pc-cafe-candid",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fgpt-image-2%2Fexample-3.png/tr:w-1920,q-80/example-3.webp",
    prompt:
      "A photorealistic candid shot of a young man in a light grey hoodie sitting at a premium PC cafe, focused on his laptop screen, soft window light mixing with monitor glow, shallow depth of field",
  },
  {
    id: "youtube-ui-recreation",
    url: "https://www.jxp.com/_next/image?url=https%3A%2F%2Fcysource.jxp.com%2Fhomepage%2Fgpt-image-case%2Fgpt-image-06.png&w=1080&q=75",
    prompt:
      "A pixel-perfect recreation of the YouTube homepage UI with a left sidebar, top navigation bar with search and profile icon, category filter chips, and an 8-video thumbnail grid with realistic titles, channel names, view counts, and duration stamps",
  },
];
