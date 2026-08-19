"use client";

import { useLayoutEffect, useRef } from "react";
import { Ban, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
}

export function ComposerPromptField({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) autoResize(ref.current);
  }, [value]);

  return (
    <div className={cn("flex items-start gap-3 px-1 py-1", className)}>
      <Pencil className="mt-2.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <textarea
        ref={ref}
        rows={1}
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
        className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-body text-ink-soft placeholder:text-muted focus:outline-none"
      />
      <kbd className="mt-2 hidden shrink-0 items-center gap-1 rounded-md border border-line bg-surface-3 px-2 py-1 text-caption text-muted sm:flex">
        ⌘ Enter
      </kbd>
    </div>
  );
}

/** A slim second line under the main prompt — e.g. a negative prompt. */
export function ComposerSecondaryField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 border-t border-line px-1 pt-2.5", className)}>
      <Ban className="size-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-1 text-body-sm text-ink-soft placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}
