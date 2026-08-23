"use client";

import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { ReferenceUploadTile } from "./reference-row";
import { cn } from "@/lib/utils";

export type ReferenceMode = "reference" | "keyframe";

type FrameSlot = {
  previewUrl?: string | null;
  uploading?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
};

const MODE_LABEL: Record<ReferenceMode, string> = {
  reference: "Reference",
  keyframe: "Keyframe",
};

/** Dropdown-driven switcher between a single "Reference" image slot and a
 * "Keyframe" pair (first frame → last frame, with a swap control between
 * them) — the box(es) shown below the dropdown change with the selection,
 * matching ArtCraft/Higgsfield's own first/last-frame picker. The caller
 * owns the actual upload state for both slots (same `image` /
 * `lastFrameImage` fields either way) and is responsible for clearing the
 * last-frame slot when switching back to "Reference". */
export function KeyframeReferenceControl({
  mode,
  onModeChange,
  first,
  last,
  lastDisabled,
  onSwap,
}: {
  mode: ReferenceMode;
  onModeChange: (mode: ReferenceMode) => void;
  first: FrameSlot;
  last: FrameSlot;
  lastDisabled?: boolean;
  onSwap?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <DropdownRoot>
        <DropdownTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-caption font-medium text-muted transition-colors hover:text-ink-soft"
          >
            {MODE_LABEL[mode]}
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
        </DropdownTrigger>
        <DropdownContent align="start" className="w-48 rounded-xl border-line bg-surface-3 p-1.5 shadow-floating">
          <DropdownItem
            onSelect={() => onModeChange("reference")}
            className={cn("rounded-lg px-3 py-2.5", mode === "reference" && "text-brand")}
          >
            <div>
              <p className="text-label font-medium">Reference image</p>
              <p className="text-caption text-muted">Guide the whole generation</p>
            </div>
          </DropdownItem>
          <DropdownItem
            onSelect={() => onModeChange("keyframe")}
            className={cn("rounded-lg px-3 py-2.5", mode === "keyframe" && "text-brand")}
          >
            <div>
              <p className="text-label font-medium">Keyframe</p>
              <p className="text-caption text-muted">Set a first and last frame</p>
            </div>
          </DropdownItem>
        </DropdownContent>
      </DropdownRoot>

      {mode === "keyframe" ? (
        <div className="flex items-center">
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
          <button
            type="button"
            onClick={onSwap}
            aria-label="Swap first and last frame"
            title="Swap first and last frame"
            className="z-10 -mx-3 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-3 text-muted shadow-raised transition-colors hover:text-ink-soft"
          >
            <ArrowLeftRight className="size-3" aria-hidden="true" />
          </button>
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
      ) : (
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
    </div>
  );
}
