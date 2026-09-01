"use client";

import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the studio's left-hand composer panel — the media.io-
 * style vertical form (model → upload → prompt → settings → generate) that
 * replaced the old bottom-docked composer bar. Everything here is layout
 * chrome only; forms keep owning their own state, validation and uploads.
 */

/** One labeled block of the panel — section title on its own line, optional
 * control (e.g. a mode switcher) right-aligned beside it, optional helper
 * text under the content. */
export function PanelSection({
  label,
  action,
  hint,
  children,
}: {
  label: string;
  action?: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label font-medium text-ink-soft">{label}</span>
        {action}
      </div>
      {children}
      {hint && <p className="text-caption text-muted">{hint}</p>}
    </section>
  );
}

/** How the upload slot is being used: one image guiding the whole
 * generation, or a first/last keyframe pair the video interpolates
 * between. The caller owns the actual upload state for every slot and is
 * responsible for clearing whichever fields don't apply to the newly
 * selected mode. */
export type ReferenceMode = "reference" | "keyframe";

/** Compact segmented control — the panel's equivalent of the reference
 * design's sub-tabs ("Image à Vidéo / Texte à Vidéo"), used here to switch
 * the upload slot between its reference/keyframe modes. */
export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  renderLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-line bg-surface-dark p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md px-2.5 py-1 text-caption font-medium transition-colors",
            opt === value ? "bg-surface-3 text-ink shadow-raised" : "text-muted hover:text-ink-soft",
          )}
        >
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

/** The panel's prompt box — a bordered multi-line field with the character
 * count and the ⌘Enter affordance inside its own frame, rather than the
 * bar composer's borderless inline textarea. */
export function PanelPromptField({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-dark transition-colors duration-200 focus-within:border-border-strong">
      <textarea
        rows={4}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className="w-full resize-none bg-transparent px-3.5 pt-3 text-body-sm text-ink-soft placeholder:text-muted focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5">
        <kbd className="hidden items-center gap-1 rounded-md border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-caption text-muted sm:flex">
          ⌘ Enter
        </kbd>
        {maxLength !== undefined && (
          <span className="ml-auto text-caption text-muted">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/** Wraps a stack of FieldRow rows in the panel's input-surface frame so the
 * settings list reads as one grouped control, not floating rows. */
export function PanelFieldList({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-line bg-surface-dark px-3.5">{children}</div>;
}

/**
 * Full-width click-or-drag image drop zone — the panel-scale version of the
 * old composer bar's 64px upload tile. Same contract (caller owns upload
 * state and the uploaded URL; this only picks the file), plus real
 * drag-and-drop, which a tile too small to drop onto never needed.
 */
export function PanelDropzone({
  label,
  sublabel,
  previewUrl,
  uploading,
  onFile,
  onRemove,
  disabled,
  disabledHint,
  compact,
  className,
}: {
  label: string;
  sublabel?: string;
  previewUrl?: string | null;
  uploading?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  disabledHint?: string;
  /** Keyframe pair tiles — shorter box, no sublabel, smaller icon. */
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const hasFile = Boolean(previewUrl);
  const clickable = !disabled && !hasFile;

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 text-center transition-[background-color,border-color,box-shadow] duration-200",
        compact ? "h-28 px-2" : "h-36 px-4",
        hasFile
          ? "border-solid border-line bg-surface-2 shadow-glow-sm"
          : "border-dashed border-brand/25 bg-surface-2/40",
        clickable && "cursor-pointer hover:border-brand/50 hover:bg-brand/5 hover:shadow-glow-sm",
        clickable && dragOver && "border-brand/60 bg-brand/10 shadow-glow-sm",
        disabled && "cursor-not-allowed opacity-35",
        className,
      )}
      onClick={() => {
        if (clickable) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        if (!clickable) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!clickable) return;
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      title={disabled ? disabledHint : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      {previewUrl ? (
        // Local blob: URL or already-uploaded remote URL filling a fixed
        // slot, so a plain <img> is the right tool — next/image would
        // force/crop dimensions we don't know here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <span
            className={cn(
              "flex items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand transition-colors duration-200 group-hover:border-brand/60 group-hover:bg-brand/20",
              compact ? "size-8" : "size-10",
            )}
          >
            {uploading ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            ) : (
              <ImagePlus className={compact ? "size-4" : "size-5"} aria-hidden="true" />
            )}
          </span>
          <span className="text-caption font-medium text-ink-soft">{label}</span>
          {!compact && sublabel && <span className="text-caption text-muted">{sublabel}</span>}
        </>
      )}

      {hasFile && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
