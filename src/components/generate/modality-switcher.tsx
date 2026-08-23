"use client";

import Link from "next/link";
import { Video, Wand2, Image as ImageIcon, AudioLines, ChevronDown, type LucideIcon } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { pillClass } from "./composer";
import { cn } from "@/lib/utils";
import type { GenerationType } from "@/lib/constants";

// Each modality is its own route (/generate, /generate/image-to-video,
// /generate/image) rather than client-side tabs — mirrors ArtCraft's
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
}[] = [
  {
    type: "text-to-video",
    href: "/generate",
    label: "Video",
    icon: Video,
    heroTitle: "Create Video",
    heroSubtitle: "Describe a scene. See it in motion.",
  },
  {
    type: "image-to-video",
    href: "/generate/image-to-video",
    label: "Image to Video",
    icon: Wand2,
    heroTitle: "Animate an Image",
    heroSubtitle: "Bring a still photo to life.",
  },
  {
    type: "text-to-image",
    href: "/generate/image",
    label: "Image",
    icon: ImageIcon,
    heroTitle: "Create Image",
    heroSubtitle: "Describe a scene. See it rendered.",
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
