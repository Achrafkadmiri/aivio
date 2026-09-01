// One-tap "viral preset" recipes for the /presets section: each one is a
// locked, pre-written Seedance 2.0 prompt + parameter set, so the only thing
// a user supplies is a single reference image. The composer at /generate is
// still the full-control surface — this is the opposite end of that dial.
//
// Honesty note, same as prompt-templates.ts: `previewUrl` points at one of
// the local sample clips in public/media/videos and is there to show the
// *kind* of shot the preset aims for. It is not a claim that this preset's
// prompt produced that clip, and the UI must keep framing it as a style
// preview (see PresetCard / PresetStudio).
//
// Deliberately no aspectRatio field: every preset ships a reference image,
// and Seedance ignores aspect ratio whenever one is set (the video inherits
// the image's) — see the aspect-ratio FieldRow in seedance2-video-form.tsx.
// Advertising a ratio we know is ignored would just be a lie on a chip.

import {
  SEEDANCE2_MODEL_ID,
  SEEDANCE2_DURATION_MIN,
  SEEDANCE2_RESOLUTIONS,
  type TierInfo,
} from "@/lib/constants";
import {
  isResolutionLocked,
  isDurationLocked,
  bestAllowedResolution,
  minTierForResolution,
  upgradeHint,
} from "@/lib/tier-limits";

export const PRESET_CATEGORIES = ["Trending", "Portrait", "Product", "Motion", "Playful"] as const;
export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export type ViralPreset = {
  slug: string;
  title: string;
  /** One line on the card — what the preset does to your image. */
  tagline: string;
  category: PresetCategory;
  /** Local style-preview clip, see the honesty note above. */
  previewUrl: string;
  /** Optional card pill. Kept to "New" — nothing here counts real usage, so
   * a "Hot" / "#1 this week" badge would be an invented number. */
  badge?: "New";
  /** What kind of photo this preset actually needs, shown by the dropzone. */
  imageHint: string;
  /** What the uploaded image *is*, phrased for the model — fills the
   * `@image = …` definition line buildPresetPrompt prepends. Written as a
   * noun phrase that completes "@image = ___". */
  referenceSubject: string;
  /** Locked prompt — never editable here, but readable (see the studio's
   * "What this preset does" disclosure) so it isn't a black box. */
  prompt: string;
  duration: number;
  resolution: (typeof SEEDANCE2_RESOLUTIONS)[number];
  cameraFixed: boolean;
  generateAudio: boolean;
};

const CLIPS = {
  seedance: "/media/videos/01_seedance_2_0_1b29ad9ce6.mp4",
  makeupGirl: "/media/videos/makeup-girl.mp4",
  model: "/media/videos/model.mp4",
  msc: "/media/videos/msc6H2R1htn6Mzjy_OPku_video.mp4",
  sippo: "/media/videos/sippo.mp4",
} as const;

export const VIRAL_PRESETS: ViralPreset[] = [
  {
    slug: "hair-flip-glow",
    title: "Hair Flip Glow",
    tagline: "Your portrait turns to camera and flips their hair in slow motion.",
    category: "Trending",
    previewUrl: CLIPS.makeupGirl,
    badge: "New",
    imageHint: "A clear portrait — face visible, hair not tied back.",
    referenceSubject: "the person this video is of",
    prompt: `【Style】Beauty-campaign hyperrealism, slow motion, soft key light with a warm rim, glossy confident tone.
【Duration】5 seconds
【Main Character】The person in @image, identity and outfit preserved exactly.
[00:00-00:02] Shot 1: The turn.
Scene: Same setting and lighting as @image, camera at eye level.
Action: The subject turns their head toward camera and lifts their chin, holding eye contact.
Key detail: Facial structure, skin texture and hair color must match @image exactly — no drift.
[00:02-00:05] Shot 2: The flip.
Scene: Same framing, camera pushes in a few centimetres.
Action: The subject flips their hair back in slow motion; individual strands separate and catch the rim light.
Key detail: Hair moves with real weight and settles — no rubber-sheet warping at the tips.`,
    duration: 5,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: false,
  },
  {
    slug: "cinematic-push-in",
    title: "Cinematic Push-In",
    tagline: "A slow dolly toward your subject, shallow depth of field, film grade.",
    category: "Portrait",
    previewUrl: CLIPS.seedance,
    imageHint: "Any photo with one clear subject and some space around it.",
    referenceSubject: "the subject and the environment this shot takes place in",
    prompt: `【Style】Prestige-drama cinematography, hyperrealism, anamorphic shallow depth of field, motivated practical lighting, restrained tone.
【Duration】5 seconds
【Main Character】The subject of @image, unchanged.
[00:00-00:05] Shot 1: The push.
Scene: The exact environment of @image, its lighting direction preserved.
Action: The camera dollies slowly and steadily toward the subject while the background falls further out of focus.
Key detail: The move is mechanically smooth and continuous — a real dolly, never a digital zoom or a handheld drift.
Key detail: The subject stays alive between beats — a blink, a small breath, a micro shift of weight.`,
    duration: 5,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: false,
  },
  {
    slug: "product-hero-spin",
    title: "Product Hero Spin",
    tagline: "Your product rotates on a dark reflective set under a moving rim light.",
    category: "Product",
    previewUrl: CLIPS.sippo,
    imageHint: "A product shot on a plain background — the cleaner the cutout, the better.",
    referenceSubject: "the product this commercial is for",
    prompt: `【Style】Ultra-premium product commercial, macro hyperrealism, locked-off studio camera, dramatic sweeping rim light, indulgent tone.
【Duration】5 seconds
【Main Character】The product from @image, its shape, label and finish preserved exactly.
[00:00-00:02] Shot 1: The hold.
Scene: Dark reflective studio surface, product centered, camera locked off.
Action: The product sits still while a rim light builds from the left, revealing edge and material.
Key detail: Every logo, ridge and matte-to-gloss transition reads exactly as it does in @image.
[00:02-00:05] Shot 2: The rotation.
Scene: Same macro framing, camera still locked.
Action: The product rotates a smooth quarter-turn on its axis; the rim light travels across the surface with it.
Key detail: Reflections track the rotation physically — the light moves, the label never smears or re-renders.`,
    duration: 5,
    resolution: "1080p",
    cameraFixed: true,
    generateAudio: false,
  },
  {
    slug: "runway-walk",
    title: "Runway Walk",
    tagline: "Your subject strides toward camera like the end of a fashion show.",
    category: "Trending",
    previewUrl: CLIPS.model,
    badge: "New",
    imageHint: "A full-body or waist-up photo of one person.",
    referenceSubject: "the person walking the runway, including their outfit",
    prompt: `【Style】High-fashion runway film, hyperrealism, tracking camera retreating at walking pace, hard directional key light, assured tone.
【Duration】6 seconds
【Main Character】The person in @image, outfit and proportions preserved exactly.
[00:00-00:03] Shot 1: The approach.
Scene: A long runway in a dark hall, spill light raking across the floor.
Action: The subject walks directly toward camera at a steady, deliberate pace; the camera retreats to hold framing.
Key detail: Gait carries real weight — hips and shoulders counter-rotate, fabric swings a beat behind the body.
[00:03-00:06] Shot 2: The mark.
Scene: End of the runway, camera stops.
Action: The subject reaches their mark, plants, and holds a still pose facing camera.
Key detail: The stop is decisive — clothing and hair settle a fraction later than the body does, and the outfit is still the one in @image.`,
    duration: 6,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: false,
  },
  {
    slug: "storm-drive",
    title: "Storm Drive",
    tagline: "Rain, headlights and spray — your shot becomes a car commercial.",
    category: "Motion",
    previewUrl: CLIPS.sippo,
    imageHint: "A vehicle, or any subject you want thrown into heavy weather.",
    referenceSubject: "the vehicle or subject driving through this shot",
    prompt: `【Style】Cinematic automotive commercial, hyperrealism, low tracking camera, hard storm lighting with lens flare, epic tone.
【Duration】6 seconds
【Main Character】The subject of @image, its color and silhouette preserved.
[00:00-00:03] Shot 1: The pass.
Scene: Rain-soaked asphalt at night, low camera near ground level.
Action: The subject from @image drives past camera, throwing a wide sheet of spray; headlights streak across the lens.
Key detail: Water has mass — it arcs, breaks and falls, it does not float as particles.
[00:03-00:06] Shot 2: The pull-back.
Scene: Same road, camera rising and falling behind.
Action: The camera climbs and pulls back, opening up the storm and the empty road around the subject.
Key detail: Reflections on the wet surface stay consistent with the headlights that cast them.`,
    duration: 6,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: true,
  },
  {
    slug: "stage-spotlight",
    title: "Stage Spotlight",
    tagline: "Your subject lands in a dark venue under a single warm spotlight.",
    category: "Portrait",
    previewUrl: CLIPS.msc,
    imageHint: "A portrait or performance photo — upper body works best.",
    referenceSubject: "the person standing in the spotlight",
    prompt: `【Style】Live-music documentary, hyperrealism, slow handheld-feel drift, one hard warm spotlight against deep shadow, intimate tone.
【Duration】5 seconds
【Main Character】The person in @image, identity and clothing preserved exactly.
[00:00-00:05] Shot 1: The hold.
Scene: A dark venue, haze in the air, a single warm spotlight from high front-left.
Action: The subject from @image stands in the beam; the camera drifts a few degrees around them as haze moves through the light.
Key detail: The spotlight's edge stays soft and the falloff into black is smooth — no flat grey background.
Key detail: The subject breathes and shifts subtly; they are never a still photograph with moving light on top.`,
    duration: 5,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: false,
  },
  {
    slug: "golden-hour-drift",
    title: "Golden Hour Drift",
    tagline: "Warm low sun, drifting dust, a slow crane up over your scene.",
    category: "Motion",
    previewUrl: CLIPS.seedance,
    imageHint: "A landscape, street or wide scene with room above the subject.",
    referenceSubject: "the scene this shot is filmed in",
    prompt: `【Style】Travel-film cinematography, hyperrealism, smooth crane move, low golden-hour sun with long shadows, calm tone.
【Duration】6 seconds
【Main Character】The scene from @image, its composition and content preserved.
[00:00-00:03] Shot 1: The drift.
Scene: The scene in @image, relit by a low warm sun raking in from one side.
Action: The camera drifts slowly sideways; dust and pollen catch the light in the foreground.
Key detail: Shadows lengthen consistently from one light direction — no second invented sun.
[00:03-00:06] Shot 2: The rise.
Scene: Same scene, camera craning upward.
Action: The camera rises smoothly, opening the frame and revealing more of the surroundings.
Key detail: The rise is even and mechanical, and the horizon stays level throughout.`,
    duration: 6,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: true,
  },
  {
    slug: "cozy-laugh",
    title: "Cozy Laugh",
    tagline: "Your photo warms up into a genuine, unscripted laugh.",
    category: "Playful",
    previewUrl: CLIPS.seedance,
    imageHint: "A photo of one or two people, faces clearly visible.",
    referenceSubject: "the people in this scene and the room they are in",
    prompt: `【Style】Slice-of-life mockumentary, hyperrealism, handheld-feel camera, warm natural indoor light, cozy relaxed tone.
【Duration】5 seconds
【Main Character】The people in @image, identities and clothing preserved exactly.
[00:00-00:02] Shot 1: The beat before.
Scene: The setting in @image, its light warmed slightly toward late afternoon.
Action: The subject listens, mouth closed, eyes already starting to give it away.
Key detail: Micro-expressions carry this beat — a raised eyebrow, a stifled smile.
[00:02-00:05] Shot 2: The laugh.
Scene: Same framing, camera drifts a few centimetres closer.
Action: The subject breaks into a genuine, slightly-too-loud laugh, shoulders moving with it.
Key detail: The laugh looks unscripted — asymmetric, a little messy, never camera-aware.`,
    duration: 5,
    resolution: "720p",
    cameraFixed: false,
    generateAudio: true,
  },
  {
    slug: "macro-detail-crawl",
    title: "Macro Detail Crawl",
    tagline: "An extreme close-up crawl across the texture of your subject.",
    category: "Product",
    previewUrl: CLIPS.makeupGirl,
    imageHint: "Anything with texture worth staring at — fabric, food, skin, metal.",
    referenceSubject: "the surface and material being filmed",
    prompt: `【Style】Macro texture study, hyperrealism, locked slow lateral crawl, single soft raking light, patient tone.
【Duration】5 seconds
【Main Character】The surface and material of @image, unchanged.
[00:00-00:05] Shot 1: The crawl.
Scene: Extreme close-up on the subject in @image, one soft light raking across it from the side.
Action: The camera crawls laterally across the surface at a constant, unhurried speed.
Key detail: Focus stays razor-thin and consistent; grain, weave and imperfection are the subject.
Key detail: Nothing in frame is invented — the crawl reveals what @image already contains.`,
    duration: 5,
    resolution: "1080p",
    cameraFixed: true,
    generateAudio: false,
  },
];

export function findPreset(slug: string): ViralPreset | undefined {
  return VIRAL_PRESETS.find((p) => p.slug === slug);
}

/**
 * The prompt actually sent for a preset: an `@image = …` definition line
 * naming what the uploaded photo is and how strictly to hold to it, followed
 * by the preset's own recipe, whose shot lines refer back to `@image` by
 * name wherever they used to say "the reference image".
 *
 * The image already reaches the model as the `image` wire parameter either
 * way (see the Seedance2Input mapping in the backend's generation-runner) —
 * none of this makes the model *see* an image it otherwise wouldn't. What it
 * does is state the image's ROLE, which the parameter alone can't: without
 * it the model is free to read a reference as "loose inspiration" and drift
 * the face, the label or the setting. Naming the subject, saying "match it
 * exactly, replace nothing", and then pointing at that name from each shot
 * is what holds identity across the clip.
 *
 * `@image` is our own convention, not a documented Seedance token — the
 * model reads it as ordinary instruction text, which is exactly why the
 * definition line has to come first and define it. Nothing downstream parses
 * it: generations.ts stores the prompt as-is and generation-runner.ts passes
 * it through verbatim.
 *
 * Prepended here rather than written into all nine prompts so the wording
 * can be tuned in one place, and so the studio's "What this preset does"
 * disclosure can show exactly the text that goes over the wire.
 */
export function buildPresetPrompt(preset: ViralPreset): string {
  return [
    `@image = ${preset.referenceSubject}. Treat @image as the single source of truth: identity, facial structure, proportions, colors, clothing, labels and setting must match it exactly for the whole clip. Animate what is in @image — never replace, restyle or reimagine it, and never substitute a different subject.`,
    preset.prompt,
  ].join("\n");
}

/** Every preset runs on Seedance 2.0 — it's the model in the catalog that
 * takes a reference image *and* a fixed-camera / native-audio toggle, which
 * is what the recipes above are written against. */
export const PRESET_MODEL_ID = SEEDANCE2_MODEL_ID;

/**
 * What this preset will actually be submitted as on the current plan.
 *
 * A preset hides its settings, so a free-plan user pressing Generate on a
 * 1080p/6s recipe would otherwise get a bare 403 with nothing on screen
 * explaining it. Instead the settings step down to the best the plan allows
 * and the change is *stated* (`notes`) rather than made silently.
 * `blockedReason` covers the case where nothing can be stepped down to — the
 * plan can't reach any resolution this model offers, or its duration cap
 * sits under the model's 4s floor.
 *
 * The backend re-checks all of this (see aiVideo-backend's generations.ts);
 * this is UX only, like the rest of tier-limits.ts.
 */
export function resolvePresetSettings(
  preset: ViralPreset,
  tierInfo: TierInfo | undefined,
): { duration: number; resolution: string; notes: string[]; blockedReason?: string } {
  const notes: string[] = [];

  let resolution: string = preset.resolution;
  if (isResolutionLocked(resolution, tierInfo)) {
    const allowed = bestAllowedResolution(SEEDANCE2_RESOLUTIONS, tierInfo);
    if (!allowed) {
      return {
        duration: preset.duration,
        resolution,
        notes,
        blockedReason: upgradeHint(minTierForResolution(resolution), "this preset's resolution"),
      };
    }
    notes.push(
      `Rendered at ${allowed} on your plan — ${upgradeHint(minTierForResolution(preset.resolution), preset.resolution)}`,
    );
    resolution = allowed;
  }

  let duration = preset.duration;
  if (tierInfo && isDurationLocked(duration, tierInfo)) {
    const capped = Math.min(duration, tierInfo.maxDurationSeconds);
    if (capped < SEEDANCE2_DURATION_MIN) {
      return {
        duration,
        resolution,
        notes,
        blockedReason: `Your plan caps clips at ${tierInfo.maxDurationSeconds}s, under this model's ${SEEDANCE2_DURATION_MIN}s minimum.`,
      };
    }
    notes.push(`Trimmed to ${capped}s on your plan — upgrade for the full ${duration}s.`);
    duration = capped;
  }

  return { duration, resolution, notes };
}
