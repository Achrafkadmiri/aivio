"use client";

import Link from "next/link";
import { Video, Image as ImageIcon, AudioLines, ChevronDown, type LucideIcon } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { pillClass } from "./composer";
import { cn } from "@/lib/utils";
import type { GenerationType } from "@/lib/constants";

// Each modality is its own route (/generate, /generate/image) rather than
// client-side tabs — mirrors ArtCraft's
// separate /create-video, /create-image pages, and makes each mode
// independently linkable/bookmarkable. Shared between generate-workspace.tsx
// (desktop tab row + hero copy) and every composer form's mobile row (see
// ModalitySwitcherMobile below).
export const MODALITIES: {
  type: GenerationType;
  href: string;
  label: string;
  icon: LucideIcon;
  heroTitle: string;
  heroSubtitle: string;
  /** Quick-start prompt chips shown on the idle hero — tap one to seed the
   * composer's prompt field, ArtCraft/Higgsfield-style. */
  suggestions: string[];
}[] = [
  {
    type: "text-to-video",
    href: "/generate",
    label: "Video",
    icon: Video,
    heroTitle: "Create Video",
    heroSubtitle: "Describe a scene. See it in motion.",
    suggestions: [
      "Cinematic drone shot flying over a neon-lit cyberpunk city at night",
      "Astronaut walking on a glowing alien planet, epic wide shot",
      "Macro shot of raindrops falling on a window, soft bokeh lights",
      "A wolf running through a misty forest at golden hour",
    ],
  },
  {
    type: "text-to-image",
    href: "/generate/image",
    label: "Image",
    icon: ImageIcon,
    heroTitle: "Create Image",
    heroSubtitle: "Describe a scene. See it rendered.",
    suggestions: [
      "Portrait of a cyberpunk samurai, neon rim light, ultra detailed",
      "Cozy cabin in a snowy forest, warm window light, matte painting",
      "Surreal floating islands with waterfalls, dreamlike atmosphere",
      "Studio product shot of a perfume bottle, dramatic lighting",
    ],
  },
];

/** Compact modality dropdown for the composer's mobile row — replaces the
 * model picker there (which moves into the settings BottomSheet instead),
 * matching the reference mobile app's "Video ▾" pill in the bottom bar.
 * Forced to open upward (side="top") since the composer is docked to the
 * bottom of the viewport — see DropdownContent's `side` prop. Styled as a
 * bigger glass card with roomier rows, also matching the reference. */
export function ModalitySwitcherMobile({ type }: { type: GenerationType }) {
  const active = MODALITIES.find((m) => m.type === type) ?? MODALITIES[0];
  return (
    <DropdownRoot>
      <DropdownTrigger asChild>
        <button type="button" className={pillClass}>
          <active.icon className="size-3.5 text-brand" aria-hidden="true" />
          <span className="font-medium">{active.label}</span>
          <ChevronDown className="size-3 text-muted" aria-hidden="true" />
        </button>
      </DropdownTrigger>
      <DropdownContent
        align="start"
        side="top"
        className="glass w-60 rounded-2xl border-white/10 p-1.5 shadow-floating"
      >
        {MODALITIES.map((m) => (
          <DropdownItem
            key={m.type}
            asChild
            className={cn("gap-2.5 rounded-xl px-3.5 py-3", m.type === type && "text-brand")}
          >
            <Link href={m.href} className="flex items-center gap-2.5">
              <m.icon className="size-4" aria-hidden="true" />
              {m.label}
            </Link>
          </DropdownItem>
        ))}
        <div className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3.5 py-3 text-label text-muted opacity-50">
          <AudioLines className="size-4" aria-hidden="true" />
          Audio to Video
        </div>
      </DropdownContent>
    </DropdownRoot>
  );
}
