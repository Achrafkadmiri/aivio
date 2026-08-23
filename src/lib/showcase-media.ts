// DUPLIQUÉ dans aiVideo-backend/src/lib/showcase-media.ts — garder synchronisé.
// Curated sample outputs used by the marketing showcase grid and prompt
// gallery. All are real, publicly hosted example outputs from ByteDance's
// Seedance 2.0 model (via fal.ai's public examples CDN), verified reachable
// at build time.

export type ShowcaseVideo = {
  id: string;
  url: string;
  prompt: string;
  tile: "wide" | "tall" | "square"; // grid tile shape, independent of source aspect
};

export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: "friends-sofa",
    url: "https://v3b.fal.media/files/b/0a959a2a/EaIW2xdGlq41Ab1codNXE_video.mp4",
    prompt: "Two friends catching up on a lazy Sunday afternoon in a cozy, lived-in apartment",
    tile: "wide",
  },
  {
    id: "chocolate-product",
    url: "https://v3b.fal.media/files/b/0a959996/WHdnS_NXRnLTPEOmjZ6ro_video.mp4",
    prompt: "Ultra high-end product shot: dark chocolate bar snapping in half, macro detail",
    tile: "square",
  },
  {
    id: "parrot-jungle",
    url: "https://v3b.fal.media/files/b/0a9499d5/xRH9GuSLwaWggKgkeSb_Q_video.mp4",
    prompt: "Breathtaking aerial sequence of a parrot flying over a tropical jungle at golden hour",
    tile: "wide",
  },
  {
    id: "man-dancing",
    url: "https://v3b.fal.media/files/b/0a949c50/p_OwR7SSOTlubpTPk9H5A_video.mp4",
    prompt: "A man dancing",
    tile: "tall",
  },
  {
    id: "falcon-desert",
    url: "https://v3b.fal.media/files/b/0a949cfd/N8-I_49HHeNxb3XsG1EDl_video.mp4",
    prompt: "A falcon launching from a gloved hand in the Arabian desert at golden hour",
    tile: "wide",
  },
  {
    id: "nightclub-performer",
    url: "https://v3b.fal.media/files/b/0a949bce/y3Qy_QL7nh1mBtB7dnK-E_video.mp4",
    prompt: "A performer on stage under warm golden spotlights in a dimly lit nightclub",
    tile: "tall",
  },
  {
    id: "studio-portrait",
    url: "https://v3b.fal.media/files/b/0a959949/4YjMSjuKAeIIOLFiGktEi_video.mp4",
    prompt: "Studio portrait brought to life with subtle, natural motion",
    tile: "square",
  },
  {
    id: "cinematic-scene",
    url: "https://ir7z8qsacw4tk54b.public.blob.vercel-storage.com/seedance-2/hero.mp4",
    prompt: "Cinematic wide shot with natural camera movement and realistic lighting",
    tile: "wide",
  },
  {
    id: "reference-scene",
    url: "https://storage.googleapis.com/falserverless/example_outputs/bytedance/seedance_2/output.mp4",
    prompt: "Multi-reference scene composition with consistent subject identity",
    tile: "square",
  },
];

// Poster/thumbnail frames for the video grid fall back to a CSS gradient
// (see ShowcaseTile) rather than a separate image asset, so there is
// nothing to fetch before the video itself is ready.
