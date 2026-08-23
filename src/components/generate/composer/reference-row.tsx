"use client";

import { useRef } from "react";
import { Image as ImageIcon, FileVideo, Mic, Plus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadKind = "image" | "video" | "audio";

const ICONS: Record<UploadKind, LucideIcon> = { image: ImageIcon, video: FileVideo, audio: Mic };
const ACCEPT: Record<UploadKind, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
  audio: "audio/mpeg,audio/wav,audio/mp4",
};

export function ReferenceUploadRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2.5">{children}</div>;
}

export function ReferenceUploadTile({
  kind,
  label,
  shortLabel: shortLabelProp,
  optional = true,
  previewUrl,
  uploading,
  onFile,
  onRemove,
  disabled,
  disabledHint,
}: {
  kind: UploadKind;
  label: string;
  /** Overrides the default last-word-of-label caption — needed when two
   * tiles would otherwise collide (e.g. "Start Frame" / "End Frame" both
   * ending in "Frame"). */
  shortLabel?: string;
  /** Set false for a required reference (e.g. image-to-video's source image). */
  optional?: boolean;
  previewUrl?: string | null;
  uploading?: boolean;
  onFile?: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICONS[kind];
  const hasFile = Boolean(previewUrl);
  const clickable = !disabled && !hasFile;
  // Full context lives in the title tooltip — the tile itself only has room
  // for an icon and a one-word caption (see ArtCraft's own compact
  // "+ Reference" button, which does the same trade-off).
  const title = disabled ? disabledHint : `${label}${optional ? " (optional)" : " (required)"}`;
  const shortLabel = shortLabelProp ?? label.split(" ").pop();

  return (
    <div
      className={cn(
        "group relative flex size-12 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border transition-colors",
        // Solid, low-contrast border rather than dashed — a dashed frame
        // repeated across several adjacent tiles reads as "busy"; the small
        // Plus badge below is what actually signals "empty, tap to add".
        hasFile ? "border-line bg-surface-2 shadow-glow-sm" : "border-border-subtle bg-surface-2/50",
        clickable && "cursor-pointer hover:border-border-strong hover:bg-white/[0.04]",
        disabled && "cursor-not-allowed opacity-35",
      )}
      onClick={() => {
        if (clickable) inputRef.current?.click();
      }}
      title={title}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile?.(file);
          e.target.value = "";
        }}
      />
      {previewUrl && kind === "image" ? (
        // Fills the tile as a thumbnail — local blob: URL or already-uploaded
        // remote URL, this is a fixed 56px slot, not a page asset.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <Icon className="size-3.5 text-ink-soft" aria-hidden="true" />
          <span className="text-[10px] font-medium text-muted">{uploading ? "…" : shortLabel}</span>
        </>
      )}
      {hasFile ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        >
          <X className="size-2.5" />
        </button>
      ) : (
        clickable && (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-glow-sm">
            <Plus className="size-2.5" aria-hidden="true" strokeWidth={3} />
          </span>
        )
      )}
    </div>
  );
}
