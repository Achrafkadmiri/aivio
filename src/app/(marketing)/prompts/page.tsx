import type { Metadata } from "next";
import Link from "next/link";
import { PresetsGallery } from "@/components/presets/presets-gallery";

// The public face of the preset catalogue. It keeps the /prompts URL the
// site has always linked to (the in-app studio owns /presets, and two routes
// can't share a path), but what it shows is the catalogue itself rather than
// the old hand-written Seedance prompt templates: a finished recipe is what
// a visitor can actually act on, and it's the same list signed-in users get.
//
// Browsing is open — GET /api/presets is deliberately unauthenticated, and
// the recipe's prompt never leaves the server. Running one is not: see
// presetHref in presets-gallery.tsx.
export const metadata: Metadata = {
  title: "Video presets",
  description:
    "One-tap video recipes — pick a look, upload one photo, generate. No prompt writing, no settings. Browse them all; sign in to run one.",
};

export default function PromptsPage() {
  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-heading font-bold tracking-tight text-ink sm:text-display">
          Viral <span className="text-gradient">video presets</span>
        </h1>
        <p className="mt-4 text-body text-muted">
          Finished recipes — prompt, camera, length and audio already written. Pick a look, upload
          one photo, and generate. Nothing to configure and no prompt to write; if you&apos;d
          rather write your own,{" "}
          <Link href="/generate" className="text-brand underline-offset-4 hover:underline">
            the full composer
          </Link>{" "}
          is one click away.
        </p>
      </div>

      <div className="mt-14">
        <PresetsGallery />
      </div>
    </div>
  );
}
