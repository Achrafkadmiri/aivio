// DUPLIQUÉ dans aiVideo-backend/src/lib/nano-banana-showcase.ts — garder synchronisé.
// Real, publicly hosted example outputs from Google's Nano Banana image
// model family — the same model Vixerra itself offers as
// "@cf/google/nano-banana-2-lite" (see cloudflare-models.ts). No generated
// output exists yet in this app's own database (the one Nano Banana row in
// dev.db is a failed seed generation with no resultUrl), so these are
// sourced the same way SHOWCASE_VIDEOS in showcase-media.ts sources its
// video examples: real outputs published on fal.ai's model/API pages (the
// hosting provider for this model), ids/prompts transcribed verbatim from
// those pages. Every URL below was verified reachable with `curl -I`
// (200 OK, image/* content-type) on 2026-08-14.

export type NanoBananaImage = {
  id: string;
  url: string;
  prompt: string;
};

export const NANO_BANANA_IMAGES: NanoBananaImage[] = [
  {
    id: "dog-pool-action",
    url: "https://storage.googleapis.com/falserverless/example_outputs/nano-banana-2-t2i-output.png",
    prompt:
      "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dog's head above water holding a tennis ball in its mouth, and its paws paddling underwater.",
  },
  {
    id: "vaporwave-poster",
    url: "https://v3b.fal.media/files/b/0aa06665/W6vHj94aABG8gpv08Qy8U_Cu591Uqm.png",
    prompt:
      "A vaporwave poster, 'AESTHETIC' in full-width glitched characters, a Roman bust statue, a pink-and-cyan grid, palm trees, and a Windows-95-window motif, dreamy nostalgia. Pastel pink, cyan, and purple, glossy digital print, surreal melancholy, internet aesthetic.",
  },
  {
    id: "coastline-edit-before",
    url: "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    prompt: "Source portrait, before editing.",
  },
  {
    id: "coastline-edit-after",
    url: "https://v3b.fal.media/files/b/0a95c085/S0ExtNZpsp_6xygCJ3MKG_Bj98CiYt.png",
    prompt: "Make a photo of the man driving the car down the California coastline.",
  },
  {
    id: "character-consistency-1",
    url: "https://v3b.fal.media/files/b/monkey/PZgmD4CkXKPzE3OIljImR.png",
    prompt: "Same character, first scene — consistent identity across generations.",
  },
  {
    id: "character-consistency-2",
    url: "https://v3b.fal.media/files/b/panda/TMkjekLFedttiNaobpkPK.png",
    prompt: "Same character, second scene — consistent identity across generations.",
  },
  {
    id: "text-rendering",
    url: "https://storage.ghost.io/c/0e/15/0e15ee8a-bd95-4b71-9258-950f77f4d196/content/images/2025/11/LTr0ggIhhQnIcs0awva5x.png",
    prompt: "Clean, legible text rendered directly in the scene — signage, labels, and packaging.",
  },
  // The 4 below are from fal.ai's own Nano Banana 2 landing page (fal.ai/nano-banana-2),
  // verified reachable with `curl -I` (200 OK, image/webp) on 2026-08-23.
  {
    id: "coffee-mug-product",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fnano-banana-2%2Fexample-1.png/tr:w-1920,q-80/example-1.webp",
    prompt:
      "A hyperrealistic product photo of a matte ceramic coffee mug on a wooden table, morning light streaming through a window casting soft shadows, steam rising from the cup with the text 'GOOD MORNING' embossed on the side in a clean serif font, shallow depth of field, 85mm lens",
  },
  {
    id: "fisherman-portrait",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fnano-banana-2%2Fexample-2.png/tr:w-1920,q-80/example-2.webp",
    prompt:
      "A cinematic portrait of an elderly Japanese fisherman mending nets at dawn, weathered hands in sharp focus, fishing village harbor in soft bokeh behind him, golden hour side lighting, documentary photography style, Leica 50mm Summilux wide open",
  },
  {
    id: "bioluminescent-bay",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fnano-banana-2%2Fexample-3.png/tr:w-1920,q-80/example-3.webp",
    prompt:
      "An aerial view of a bioluminescent bay at night, glowing blue-green plankton tracing the wake of a small wooden boat, stars reflected in the calm water, long exposure effect, the Milky Way arching overhead, National Geographic cover quality",
  },
  {
    id: "hillside-house-viz",
    url: "https://refinery.fal.media/url/https%3A%2F%2Fir7z8qsacw4tk54b.public.blob.vercel-storage.com%2Fnano-banana-2%2Fexample-4.png/tr:w-1920,q-80/example-4.webp",
    prompt:
      "A detailed architectural visualization of a modern hillside house with floor-to-ceiling glass walls, infinity pool merging with the ocean horizon, warm interior lighting at dusk, tropical vegetation, rendered in photorealistic style with accurate reflections and volumetric light",
  },
];

export function getNanoBananaImage(id: string): NanoBananaImage {
  const image = NANO_BANANA_IMAGES.find((img) => img.id === id);
  if (!image) throw new Error(`Unknown Nano Banana showcase image id: ${id}`);
  return image;
}
