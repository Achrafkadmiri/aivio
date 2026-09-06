// In-app help: what each screen is for, and the order to do things in.
//
// One entry per route, rendered by <PageGuide /> (mounted once per layout,
// so every page gets its own guide without touching the page itself). Keep
// this file the single source of the help copy — a screen described in two
// places drifts, and the version the user reads should be the one shipped
// beside the screen it describes.
//
// Two rules for the copy:
//   - Steps are the order someone actually works in, not a tour of the UI.
//     If a field is optional, say so in the step that mentions it.
//   - `plan` is the tier that unlocks the screen, and must match the real
//     gate (TIER_INFO.creatorSuite for the two studios and publishing,
//     TIER_INFO.apiAccess/seats for keys and teams). A guide that promises
//     a locked screen is worse than no guide.

/** Which plan unlocks the screen a guide describes. */
export type GuidePlan = "any" | "creator" | "studio" | "staff";

/** Tone of the closing note — `gate` is reserved for plan limits. */
export type GuideNoteTone = "info" | "warn" | "gate";

export type PageGuide = {
  /** Route the guide describes. A `*` segment matches any single segment,
   *  so "/presets/*" covers every preset without listing slugs. */
  path: string;
  title: string;
  /** One line: what this screen is for. */
  what: string;
  /** The order to do things in. */
  steps: string[];
  note?: string;
  noteTone?: GuideNoteTone;
  plan: GuidePlan;
};

export const PAGE_GUIDES: PageGuide[] = [
  // ---------------------------------------------------------------- app
  {
    path: "/dashboard",
    title: "Dashboard",
    what: "Your balance, this month's volume, and your latest work.",
    plan: "any",
    steps: [
      "Check your credit balance before starting a long or high-resolution job.",
      "Read generations this month and the 30-day usage chart to see where credits went.",
      "Open anything from recent generations, or jump straight to plan and billing.",
    ],
    note: "Roughly per 1,000 credits: 333 images, 71s of Seedance 2.0, or 21s of Seedance 2.5.",
  },
  {
    path: "/generate",
    title: "Video composer",
    what: "The main screen. Text to video by default — the switcher flips it to image.",
    plan: "any",
    steps: [
      "Model: Seedance 2.5 for up to 30s with reference control, or 2.0 for up to 4K with a fixed camera.",
      "Reference (optional): drop a first frame and/or last frame to animate a still you already have. The swap button flips the two.",
      "Characters (optional): add a subject you want kept consistent across generations.",
      "Prompt: describe the scene. One or two concrete sentences beat a list of adjectives.",
      "Settings: duration, resolution, aspect ratio, fix camera position, generate audio, and a seed — leave the seed on Random unless you are re-rolling the same shot.",
      "Check the credit pill, generate, and watch the job card stream progress. No refreshing.",
    ],
    note: "Reusing a seed with the same settings is how you iterate on one shot instead of rolling a new one.",
  },
  {
    path: "/generate/image",
    title: "Image composer",
    what: "Nine image models, 14 style presets, and plain-language editing.",
    plan: "any",
    steps: [
      "Pick a model: GPT Image 2 for quality tiers, Nano Banana Pro for up to 4K, Recraft v4.1 Vector when you need real SVG.",
      "Write the prompt, then add a style preset — it appends a medium and treatment every model reads the same way.",
      "Use enhance prompt to expand a rough idea into a model-ready one.",
      "To change a result, describe the change in a sentence. No masks, no region selection.",
    ],
  },
  {
    path: "/presets",
    title: "Preset gallery",
    what: "Finished recipes — prompt, camera, length and audio already written.",
    plan: "any",
    steps: [
      "Browse the categories: Trending, Portrait, Product, Motion, Playful.",
      "The preview clip shows the kind of shot a preset aims for, not that preset's own output.",
      "Open one to run it. Want to change something? The full composer is still at /generate.",
    ],
  },
  {
    path: "/presets/*",
    title: "Running a preset",
    what: "Three steps: pick a preset, upload one image, generate and download.",
    plan: "any",
    steps: [
      "Your image is required — select a PNG or JPG from your device.",
      "Some recipes redraw it into a character first; that character is what the video model then animates.",
      "Generate, then download. There is nothing else to configure.",
    ],
    note: "If a recipe asks for more than your plan allows, the studio steps it down and shows the job it is really about to submit.",
  },
  {
    path: "/studio",
    title: "Marketing studio",
    what: "Ad-ready image and video from your own product and talent.",
    plan: "creator",
    steps: [
      "Pick a style, then attach your assets — the product, and a face if the ad needs one.",
      "Write the brief: what it is, who it is for, the format and the pace.",
      "Your product and talent are composited into a single reference sheet, because a generation carries exactly one input image.",
      "Review the composed prompt and the price, then generate.",
    ],
    note: "Included from the Créateur plan up.",
    noteTone: "gate",
  },
  {
    path: "/editor",
    title: "Editing studio",
    what: "Cut, trim and combine your generations into one clip, then export an MP4.",
    plan: "creator",
    steps: [
      "Add clips from the media library, or send one straight here from the gallery.",
      "Choose the delivery frame: 9:16, 4:5, 1:1, 16:9 or 21:9.",
      "Arrange on the timeline — split, reorder, duplicate, trim — and add text overlays, a watermark or music.",
      "Adjust the selected clip in the inspector. Undo and redo cover every step.",
      "Export. Rendering happens in your browser, so leave the tab open until it finishes.",
    ],
    note: "Included from the Créateur plan up.",
    noteTone: "gate",
  },
  {
    path: "/my-gallery",
    title: "My gallery",
    what: "Everything you have generated, with the prompt and settings kept alongside it.",
    plan: "any",
    steps: [
      "Narrow by type and status — failed jobs are listed too, so you can see what went wrong.",
      "Open a result for its full prompt, any negative prompt, and its parameters.",
      "From there: download, add to a collection, send it to the editor, or publish it.",
    ],
  },
  {
    path: "/collections",
    title: "Collections",
    what: "Organize generations into shareable groups — one per campaign, client or idea.",
    plan: "any",
    steps: [
      "Create a collection and name it.",
      "Add work from the gallery, or from a result's own menu.",
      "Open a collection to reorder, remove items, or share it.",
    ],
  },
  {
    path: "/collections/*",
    title: "Inside a collection",
    what: "The contents, plus the control that mints a public link.",
    plan: "any",
    steps: [
      "Review what is in it and drop anything that does not belong.",
      "Share it to generate a public link.",
      "Send that link to anyone — they need no Vixerra account to open it.",
    ],
    note: "Anyone holding the link can open it. Treat the link itself as the permission.",
    noteTone: "warn",
  },
  {
    path: "/c/*",
    title: "Shared collection",
    what: "A collection someone shared with you, read-only.",
    plan: "any",
    steps: [
      "Browse and play everything in it — no sign-in needed.",
      "To make your own, start a free account; it opens with 50 credits.",
    ],
  },
  {
    path: "/settings",
    title: "Profile",
    what: "Your details, and the way through to every other settings screen.",
    plan: "any",
    steps: [
      "Update your profile fields and save.",
      "Use the settings nav for billing, API keys, security, social accounts and team.",
    ],
  },
  {
    path: "/settings/billing",
    title: "Billing & credits",
    what: "Current plan, credit balance, display currency, and top-ups.",
    plan: "any",
    steps: [
      "Check your current plan and credit balance.",
      "Switch plans here — this is where 4K, API access and extra seats come from.",
      "Need credits without changing plan? Buy a top-up pack.",
      "Set the display currency if you would rather read prices in your own.",
    ],
    note: "On Créateur and Studio, unused credits roll over for one month. On Découverte and Starter they do not.",
  },
  {
    path: "/settings/api-keys",
    title: "API keys",
    what: "Issue your own keys and drive generation from your own stack.",
    plan: "studio",
    steps: [
      "Create a key and copy it immediately — treat it like a password.",
      "Use it from your integration; usage draws on the same credit balance.",
      "Revoke a key the moment it might have leaked.",
    ],
    note: "API access is a Studio-plan feature.",
    noteTone: "gate",
  },
  {
    path: "/settings/security",
    title: "Security",
    what: "Change your password.",
    plan: "any",
    steps: [
      "Enter your current password, then the new one twice.",
      "Save. If you have forgotten the current one, use the forgot-password flow instead.",
    ],
  },
  {
    path: "/settings/social",
    title: "Linked accounts",
    what: "Connect the platforms you publish to, once.",
    plan: "creator",
    steps: [
      "Choose a platform and authorize Vixerra on its own consent screen.",
      "You return here with the account listed.",
      "Unlink any time — scheduled posts for that account stop being possible.",
    ],
    note: "Publishing to linked accounts is included from the Créateur plan up.",
    noteTone: "gate",
  },
  {
    path: "/settings/team",
    title: "Team",
    what: "Shared workspace, invited by email.",
    plan: "studio",
    steps: [
      "Create your team first — until you do, there is nothing to invite anyone into.",
      "Invite by email; each invite becomes its own link.",
      "Manage who is in it. You hold the owner role; everyone else joins as a member.",
    ],
    note: "Team accounts are a Studio feature, with 3 seats.",
    noteTone: "gate",
  },
  {
    path: "/invite/*",
    title: "Team invite",
    what: "An invitation to join someone's Vixerra workspace.",
    plan: "any",
    steps: [
      "Sign in, or create an account if you do not have one.",
      "Accept, and you share that team's workspace from then on.",
    ],
  },

  // --------------------------------------------------------------- auth
  {
    path: "/signup",
    title: "Create an account",
    what: "Opens the free Découverte plan with 50 credits.",
    plan: "any",
    steps: [
      "Enter your email and a password.",
      "Confirm, and you land on the dashboard with your balance showing.",
      "Spend the first 50 credits on the cheapest model — Seedance 2.0 Mini at 3s / 480p is the one shot that fits the free budget.",
    ],
    note: "Free output is watermarked and capped at 480p / 5s. The watermark goes away on Starter.",
    noteTone: "warn",
  },
  {
    path: "/login",
    title: "Sign in",
    what: "Email and password, or a linked identity.",
    plan: "any",
    steps: [
      "Enter your credentials.",
      "You return to whatever you were doing, or to the dashboard.",
      "Forgotten it? Use the reset link below the form.",
    ],
  },
  {
    path: "/forgot-password",
    title: "Recover a password",
    what: "Sends a reset link to the email on the account.",
    plan: "any",
    steps: [
      "Type the email your account uses.",
      "Open the emailed link — it expires, so use the newest one.",
      "Set a new password and sign in.",
    ],
  },
  {
    path: "/reset-password",
    title: "Set a new password",
    what: "The screen the emailed reset link opens.",
    plan: "any",
    steps: [
      "Choose a new password and confirm it.",
      "Save, then sign in with it.",
    ],
    note: "If the link has expired, request a fresh one from forgot-password.",
    noteTone: "warn",
  },

  // ---------------------------------------------------------- marketing
  {
    path: "/",
    title: "Welcome to Vixerra",
    what: "An AI video and image studio: prompt, generate, cut, publish.",
    plan: "any",
    steps: [
      "Try the hero widget to see the flow before signing up.",
      "Any try it link opens the composer with that model already selected.",
      "Start free — the Découverte plan opens with 50 credits and no card.",
    ],
  },
  {
    path: "/features",
    title: "Features",
    what: "The model line-up, the feature grid, and the four-step loop.",
    plan: "any",
    steps: [
      "Compare what each model is for before you spend credits on it.",
      "The loop is always the same: prompt or upload, pick a model, refine, export.",
    ],
  },
  {
    path: "/pricing",
    title: "Pricing",
    what: "All four plans side by side.",
    plan: "any",
    steps: [
      "Compare on the three things that actually differ: resolution ceiling, clip length, and whether the creator suite is included.",
      "The creator suite is the marketing studio, the editing studio and publishing — it starts at Créateur.",
      "Switch the display currency if prices read oddly to you.",
    ],
  },
  {
    path: "/gallery",
    title: "Public gallery",
    what: "Work shared publicly by other people.",
    plan: "any",
    steps: [
      "Browse for reference and ideas.",
      "Like what you want to find again.",
    ],
  },
  {
    path: "/prompts",
    title: "Prompt gallery",
    what: "Shot-by-shot templates in Seedance's bracket format, with suggested parameters.",
    plan: "any",
    steps: [
      "Find a clip close to what you want to make.",
      "Read its template: style, duration, main character, then timed shots.",
      "Copy and adapt it, or open it in the generator fully pre-filled.",
    ],
    note: "These are templates written to be adapted — not the literal prompts that produced the clips beside them.",
  },
  {
    path: "/about",
    title: "About Vixerra",
    what: "Who builds this and why.",
    plan: "any",
    steps: ["Read the background, then head to /features for what the product actually does."],
  },
  {
    path: "/contact",
    title: "Contact",
    what: "How to reach the team.",
    plan: "any",
    steps: [
      "Use this for anything account-specific — billing, a stuck generation, a refund question.",
      "Include your account email so it can be matched to your generations.",
    ],
  },
  {
    path: "/privacy",
    title: "Privacy policy",
    what: "What is collected, stored and shared.",
    plan: "any",
    steps: ["Read before uploading someone else's likeness or a client's product photography."],
  },
  {
    path: "/terms",
    title: "Terms",
    what: "The rules covering your account and your output.",
    plan: "any",
    steps: [
      "Check the commercial-licence wording before using output in paid work.",
      "The commercial licence starts at Starter; the free plan does not carry one.",
    ],
  },

  // -------------------------------------------------------------- admin
  {
    path: "/admin/login",
    title: "Staff sign-in",
    what: "The way into the admin panel.",
    plan: "staff",
    steps: ["Sign in with a staff account. Ordinary accounts cannot reach the panel."],
  },
  {
    path: "/admin",
    title: "Admin overview",
    what: "The health of the platform at a glance.",
    plan: "staff",
    steps: [
      "Scan the headline metrics first.",
      "Anything unusual: open Generations to see the jobs behind it.",
    ],
  },
  {
    path: "/admin/generations",
    title: "Generations",
    what: "Every job running through the platform.",
    plan: "staff",
    steps: [
      "Filter to the account or model in question.",
      "Open a job to see its parameters and its failure reason.",
      "Credit a refund from the Credits screen if a job failed on our side.",
    ],
  },
  {
    path: "/admin/users",
    title: "Users",
    what: "Find an account and open its full picture.",
    plan: "staff",
    steps: [
      "Search by email.",
      "Open a user for their plan, balance and generation history.",
    ],
  },
  {
    path: "/admin/users/*",
    title: "One account",
    what: "Everything about a single user.",
    plan: "staff",
    steps: [
      "Confirm the plan and balance before acting on a support ticket.",
      "Adjust credits from the Credits screen — every change lands in the audit log.",
    ],
  },
  {
    path: "/admin/credits",
    title: "Credits",
    what: "Adjust an account's balance.",
    plan: "staff",
    steps: [
      "Find the account, enter the adjustment, and say why.",
      "The reason is what the audit log shows later — write it for someone who was not here.",
    ],
    note: "Every adjustment is recorded in the audit log.",
    noteTone: "warn",
  },
  {
    path: "/admin/presets",
    title: "Presets",
    what: "The recipe catalogue, editable without a deploy.",
    plan: "staff",
    steps: [
      "Compose a recipe: pick any model in the catalogue and set its parameters.",
      "Add the preview clip, category and badge — the preview shows the kind of shot, so pick one that is honest about the result.",
      "Publish; it appears in /presets immediately.",
    ],
    note: "A preset's prompt stays server-side. The browser only ever sends the slug.",
  },
  {
    path: "/admin/content",
    title: "Content",
    what: "What the public gallery shows.",
    plan: "staff",
    steps: [
      "Review what has been shared publicly.",
      "Feature the work worth showing, and remove anything that should not be there.",
    ],
  },
  {
    path: "/admin/support",
    title: "Support",
    what: "The inbound queue.",
    plan: "staff",
    steps: [
      "Work oldest first.",
      "Check the user's account and their recent generations before replying.",
    ],
  },
  {
    path: "/admin/audit",
    title: "Audit log",
    what: "The record of every staff action.",
    plan: "staff",
    steps: [
      "Check it before and after any change to someone's account.",
      "Filter by staff member or by account to reconstruct what happened.",
    ],
  },
];

/** True when `pattern` describes `path`, treating `*` as one segment. */
function matches(pattern: string, path: string): boolean {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return false;
  return p.every((segment, i) => segment === "*" || segment === s[i]);
}

/**
 * The guide for a pathname, or null when the screen has none.
 *
 * Exact routes win over wildcard ones, so "/collections" keeps its own
 * guide rather than being swallowed by "/collections/*".
 */
export function getPageGuide(pathname: string): PageGuide | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  return (
    PAGE_GUIDES.find((guide) => guide.path === path) ??
    PAGE_GUIDES.find((guide) => guide.path.includes("*") && matches(guide.path, path)) ??
    null
  );
}
