"use client";

import { type ReactNode } from "react";
import { Check, ChevronDown, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Shared trigger style for every pill in the composer toolbar — boxy
 * rounded-md rather than a full pill, matching ArtCraft's own secondary
 * controls (their primary CTA stays full-pill, see CreditsSubmitPill). */
export const pillClass = cn(
  "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5",
  "text-label text-ink-soft transition-colors hover:border-border-strong hover:bg-surface-3",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface-2",
);

/** Wraps a disabled pill with a tooltip explaining why — used instead of a
 * native `title` attribute so it matches the rest of the app's floating UI.
 * The extra `span` matters: disabled elements don't fire pointer events, so
 * the hover target has to be the (non-disabled) wrapper around the button. */
export function DisabledPillHint({ hint, children }: { hint?: string; children: ReactNode }) {
  if (!hint) return <>{children}</>;
  return (
    <Tooltip content={hint}>
      <span className="inline-flex" tabIndex={0}>
        {children}
      </span>
    </Tooltip>
  );
}

/** A pill that opens a single-select list — duration, resolution, aspect ratio, ... */
export function PillSelect<T extends string | number>({
  icon: Icon,
  value,
  options,
  renderLabel,
  onChange,
  disabled,
  disabledHint,
}: {
  icon: LucideIcon;
  value: T;
  options: readonly T[];
  renderLabel?: (v: T) => string;
  onChange: (v: T) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const label = renderLabel ? renderLabel(value) : String(value);
  const trigger = (
    <DropdownTrigger asChild>
      <button type="button" disabled={disabled} className={pillClass}>
        <Icon className="size-3.5 text-muted" aria-hidden="true" />
        <span className="font-medium">{label}</span>
        <ChevronDown className="size-3 text-muted" aria-hidden="true" />
      </button>
    </DropdownTrigger>
  );
  return (
    <DropdownRoot>
      {disabled ? (
        <DisabledPillHint hint={disabledHint}>{trigger}</DisabledPillHint>
      ) : (
        trigger
      )}
      <DropdownContent align="start" className="max-h-72 w-44 overflow-y-auto">
        {options.map((opt) => (
          <DropdownItem
            key={String(opt)}
            onSelect={() => onChange(opt)}
            className="flex items-center gap-2"
          >
            <Check
              className={cn("size-3.5 shrink-0", opt === value ? "text-brand" : "text-transparent")}
              aria-hidden="true"
            />
            {renderLabel ? renderLabel(opt) : String(opt)}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownRoot>
  );
}

/** A pill that opens a single numeric slider — duration, steps, ... */
export function PillSlider({
  icon: Icon,
  label,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
  helperText,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  helperText?: string;
}) {
  const display = formatValue ? formatValue(value) : String(value);
  return (
    <DropdownRoot>
      <DropdownTrigger asChild>
        <button type="button" className={pillClass}>
          <Icon className="size-3.5 text-muted" aria-hidden="true" />
          <span className="font-medium">{display}</span>
          <ChevronDown className="size-3 text-muted" aria-hidden="true" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-64 space-y-3 p-4">
        <div className="flex items-center justify-between text-caption text-muted">
          <span>{label}</span>
          <span className="text-label text-ink-soft">{display}</span>
        </div>
        <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
        {helperText && <p className="text-caption text-muted">{helperText}</p>}
      </DropdownContent>
    </DropdownRoot>
  );
}

/** A pill that opens a free-form panel — advanced toggles, seed, etc. */
export function SettingsPopover({
  children,
  active,
  label,
}: {
  children: ReactNode;
  active?: boolean;
  label?: string;
}) {
  return (
    <DropdownRoot>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(pillClass, active && "border-brand/50 text-brand")}
          aria-label="Advanced settings"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {label && <span className="font-medium">{label}</span>}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="max-h-[28rem] w-80 space-y-4 overflow-y-auto p-4">
        {children}
      </DropdownContent>
    </DropdownRoot>
  );
}

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-label text-ink-soft">{title}</p>
        {description && <p className="mt-0.5 text-caption text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
