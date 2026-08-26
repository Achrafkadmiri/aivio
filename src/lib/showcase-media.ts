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
    url: "https://cf.jxp.com/brand/seedance/8ba806b9-aa0c-4ecd-b923-f0d8dd1a3f71.mp4??v=1786430465",
    prompt: "A girl dancing kpop",
    tile: "wide",
  },
  {
    id: "man-dancing",
    url: "https://cf.jxp.com/brand/seedance/f8b3a86c-d8e9-4335-8eef-a15abc4c1321.mp4??v=1786696287",
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
    url: "https://cf.jxp.com/brand/seedance/167e17ed-61da-452f-b61d-6bdffc4214fb.mp4??v=1787624135",
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

// Real, publicly hosted example outputs from ByteDance's Seedance 2.5 model —
// same sourcing/verification standard as SHOWCASE_VIDEOS above, pulled from
// fal.ai's own Seedance 2.5 API docs and "workflows" example gallery
// (fal.ai/models/bytedance/seedance-2.5/{text,image,reference}-to-video and
// fal.ai/learn/tools/seedance-2-5-workflows), every URL curl-verified 200 OK
// with a video/mp4 content-type on 2026-08-26. Frontend-only for now, like
// the Nano Banana Pro / GPT Image 2 catalog entries in cloudflare-models.ts —
// not yet added to aiVideo-backend's mirrored copy of this file.
export const SEEDANCE25_SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: "anime-breathing-clash",
    url: "https://v3b.fal.media/files/b/0aa55914/_2iD5nIFuXh51iM8hCbn2_video.mp4",
    prompt:
      "Live-action anime adaptation — twin breathing-technique fighters clash on a storm-battered coastal cliff shrine at dusk, whip-pan cuts every 1.5s and volumetric fire FX",
    tile: "wide",
  },
  {
    id: "fashion-editorial-showcase",
    url: "https://v3b.fal.media/files/b/0aa55905/msc6H2R1htn6Mzjy_OPku_video.mp4",
    prompt: "Fast-paced editorial fashion showcase, artistic shots of a model",
    tile: "tall",
  },
  {
    id: "nightclub-performer",
    url: "https://cf.jxp.com/brand/seedance/167e17ed-61da-452f-b61d-6bdffc4214fb.mp4??v=1787624135",
    prompt: "A performer on stage under warm golden spotlights in a dimly lit nightclub",
    tile: "tall",
  },
  {
    id: "fashion-glitch-showcase",
    url: "https://v3b.fal.media/files/b/0aa558f3/KdG1pjSSSfQr3gSJbZdRs_video.mp4",
    prompt: "Fast-paced editorial fashion showcase with glitch effects",
    tile: "tall",
  },
    {
    id: "man-dancing",
    url: "https://cf.jxp.com/brand/seedance/f8b3a86c-d8e9-4335-8eef-a15abc4c1321.mp4??v=1786696287",
    prompt: "A man dancing",
    tile: "tall",
  },
  {
    id: "flamenco-practice-room",
    url: "https://v3b.fal.media/files/b/0aa561ed/we_usO0ddxFfvIrf3u859_video.mp4",
    prompt:
      "A flamenco dancer alone in a dark practice room, driving a long footwork sequence until dust lifts off the boards and hangs in the light",
    tile: "square",
  },
  {
    id: "night-rally-car",
    url: "https://v3b.fal.media/files/b/0aa561fb/mARe3zoTAR6lXdd-g7Glw_video.mp4",
    prompt:
      "A night stage of a gravel rally — a boxy 1980s four-wheel-drive rally car comes through a long left-hander in the pines",
    tile: "wide",
  },
  {
    id: "leather-boots-commercial",
    url: "https://v3b.fal.media/files/b/0aa562b1/nK9vZTmdciUvndsyCDtR6_video.mp4",
    prompt:
      "A 30-second commercial for a pair of hand-welted leather boots, one unbroken low tracking shot held at ankle height",
    tile: "wide",
  },
  {
    id: "rooftop-pursuit",
    url: "https://v3b.fal.media/files/b/0aa5622d/80c2PIs3OwxO56zstZPJh_video.mp4",
    prompt:
      "A rooftop pursuit from a rain-season crime picture — Hollywood action grade, anamorphic, dark and saturated",
    tile: "wide",
  },
  {
    id: "trebuchet-siege",
    url: "https://v3b.fal.media/files/b/0aa5629e/riDJP-1rX3jNHkBf8SZEe_video.mp4",
    prompt: "A siege trebuchet on a chalk ridge at first light, a crew of six working a windlass",
    tile: "square",
  },
];
