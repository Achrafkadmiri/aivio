"use client";

import { ArrowLeftRight, ChevronDown, FileVideo, Image as ImageIcon, Layers, type LucideIcon } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { ReferenceUploadTile } from "./reference-row";
import { pillClass } from "./pill";
import { cn } from "@/lib/utils";

export type ReferenceMode = "reference" | "keyframe" | "video";

type UploadSlot = {
  previewUrl?: string | null;
  uploading?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
};

const MODE_LABEL: Record<ReferenceMode, string> = {
  reference: "Reference",
  keyframe: "Keyframe",
  video: "Reference video",
};

const MODE_ICON: Record<ReferenceMode, LucideIcon> = {
  reference: ImageIcon,
  keyframe: Layers,
  video: FileVideo,
};

/** Dropdown-driven switcher between a single "Reference" image slot, a
 * "Keyframe" pair (first frame → last frame, with a swap control between
 * them), and — when the model supports it — a "Reference video" slot. Only
 * one box (or pair) is ever on screen at once, all living under the same
 * dropdown + box footprint, rather than a separate always-visible video
 * tile bolted on beside it. The caller owns the actual upload state for
 * every slot and is responsible for clearing whichever fields don't apply
 * to the newly selected mode. */
export function KeyframeReferenceControl({
  mode,
  onModeChange,
  first,
  last,
  lastDisabled,
  onSwap,
  video,
}: {
  mode: ReferenceMode;
  onModeChange: (mode: ReferenceMode) => void;
  first: UploadSlot;
  last: UploadSlot;
  lastDisabled?: boolean;
  onSwap?: () => void;
  /** Omit to hide the "Reference video" option entirely — only Seedance
   * 2.5's Cloudflare integration actually supports a reference video. */
  video?: UploadSlot;
}) {
  const ModeIcon = MODE_ICON[mode];

  return (
    <div className="flex flex-col items-start gap-2">
      <DropdownRoot>
        <DropdownTrigger asChild>
          <button
            type="button"
            className={cn(
              pillClass,
              // Same shared pill as every other composer control, plus a
              // light brand accent while the menu is open — Radix sets this
              // data-state itself, so it's a pure CSS hook, not extra state.
              "data-[state=open]:border-brand/50 data-[state=open]:text-brand",
            )}
          >
            <ModeIcon className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
            <span className="font-medium">{MODE_LABEL[mode]}</span>
            <ChevronDown className="size-3 shrink-0 text-muted" aria-hidden="true" />
          </button>
        </DropdownTrigger>
        <DropdownContent align="start" className="w-52 rounded-xl border-line bg-surface-3 p-1.5 shadow-floating">
          <DropdownItem
            onSelect={() => onModeChange("reference")}
            className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2.5", mode === "reference" && "text-brand")}
          >
            <ImageIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-label font-medium">Reference image</p>
              <p className="text-caption text-muted">Guide the whole generation</p>
            </div>
          </DropdownItem>
          <DropdownItem
            onSelect={() => onModeChange("keyframe")}
            className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2.5", mode === "keyframe" && "text-brand")}
          >
            <Layers className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-label font-medium">Keyframe</p>
              <p className="text-caption text-muted">Set a first and last frame</p>
            </div>
          </DropdownItem>
          {video && (
            <DropdownItem
              onSelect={() => onModeChange("video")}
              className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2.5", mode === "video" && "text-brand")}
            >
              <FileVideo className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-label font-medium">Reference video</p>
                <p className="text-caption text-muted">Restyle an existing clip</p>
              </div>
            </DropdownItem>
          )}
        </DropdownContent>
      </DropdownRoot>

      {mode === "keyframe" && (
        <div className="flex items-center gap-1">
          <ReferenceUploadTile
            kind="image"
            label="First frame"
            shortLabel="First frame"
            size="lg"
            previewUrl={first.previewUrl}
            uploading={first.uploading}
            onFile={first.onFile}
            onRemove={first.onRemove}
          />
          {/* A short gradient thread between the two frames reads as a tiny
              timeline — first frame interpolating into last frame — rather
              than two unrelated upload slots that happen to sit side by
              side. The swap button rotates on hover as a small, playful
              confirmation that it's a real (and reversible) action. */}
          <div className="relative flex h-20 w-8 shrink-0 items-center justify-center">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-brand/40 to-transparent"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={onSwap}
              aria-label="Swap first and last frame"
              title="Swap first and last frame"
              className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-3 text-muted shadow-raised transition-all duration-200 hover:rotate-180 hover:border-border-strong hover:text-ink-soft"
            >
              <ArrowLeftRight className="size-3" aria-hidden="true" />
            </button>
          </div>
          <ReferenceUploadTile
            kind="image"
            label="Last frame"
            shortLabel="Last frame"
            size="lg"
            previewUrl={last.previewUrl}
            uploading={last.uploading}
            onFile={last.onFile}
            onRemove={last.onRemove}
            disabled={lastDisabled}
            disabledHint="Add a first frame first."
          />
        </div>
      )}

      {mode === "reference" && (
        <ReferenceUploadTile
          kind="image"
          label="Reference"
          shortLabel="Reference"
          size="lg"
          previewUrl={first.previewUrl}
          uploading={first.uploading}
          onFile={first.onFile}
          onRemove={first.onRemove}
        />
      )}

      {mode === "video" && video && (
        <ReferenceUploadTile
          kind="video"
          label="Reference video"
          shortLabel="Video"
          size="lg"
          previewUrl={video.previewUrl}
          uploading={video.uploading}
          onFile={video.onFile}
          onRemove={video.onRemove}
        />
      )}
    </div>
  );
}
