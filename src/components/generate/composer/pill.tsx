"use client";

import { type ReactNode } from "react";
import { Check, ChevronDown, Lock, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Shared trigger style for every pill in the composer toolbar — boxy
 * rounded-lg rather than a full pill, matching ArtCraft's own secondary
 * controls (their primary CTA stays full-pill, see CreditsSubmitPill). A
 * small hover lift + press-down scale (same feel as CreditsSubmitPill's own
 * hover:-translate-y-px) makes the whole row feel like one tactile system
 * instead of static boxes. */
export const pillClass = cn(
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5",
  "text-label text-ink-soft transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
  "hover:border-border-strong hover:bg-surface-3 hover:-translate-y-px hover:shadow-raised",
  "active:translate-y-0 active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:bg-surface-2 disabled:hover:shadow-none",
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
  isOptionLocked,
  lockedHint,
}: {
  icon: LucideIcon;
  value: T;
  options: readonly T[];
  renderLabel?: (v: T) => string;
  onChange: (v: T) => void;
  disabled?: boolean;
  disabledHint?: string;
  /** Per-option gate (e.g. a resolution above the current plan's limit) —
   * unlike `disabled` (which locks the whole pill), a locked option still
   * shows up in the list with a lock icon so upgrading is discoverable. */
  isOptionLocked?: (v: T) => boolean;
  /** Tooltip text for a locked option, e.g. "Upgrade to Starter to unlock 720p." */
  lockedHint?: (v: T) => string;
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
        {options.map((opt) => {
          const locked = isOptionLocked?.(opt) ?? false;
          const item = (
            <DropdownItem
              key={String(opt)}
              disabled={locked}
              onSelect={(e) => {
                if (locked) {
                  e.preventDefault();
                  return;
                }
                onChange(opt);
              }}
              className={cn(
                "flex items-center gap-2",
                locked && "cursor-not-allowed opacity-50 data-[highlighted]:bg-transparent data-[highlighted]:text-ink-soft",
              )}
            >
              <Check
                className={cn("size-3.5 shrink-0", opt === value ? "text-brand" : "text-transparent")}
                aria-hidden="true"
              />
              <span className="flex-1">{renderLabel ? renderLabel(opt) : String(opt)}</span>
              {locked && <Lock className="size-3.5 shrink-0 text-muted" aria-hidden="true" />}
            </DropdownItem>
          );
          return locked && lockedHint ? (
            <Tooltip key={String(opt)} content={lockedHint(opt)}>
              <span className="block">{item}</span>
            </Tooltip>
          ) : (
            item
          );
        })}
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

/** The trigger for the mobile BottomSheet that replaces the composer's
 * pill row on narrow viewports — see e.g. seedance-video-form.tsx, which
 * renders this instead of the full horizontal-scroll row below `sm:`.
 * Icon-only (no label) — matches the reference mobile composer, where this
 * sits between the modality switcher and the submit button. */
export function MobileOptionsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Settings"
      className={cn(pillClass, "px-2.5")}
    >
      <SlidersHorizontal className="size-4 text-muted" aria-hidden="true" />
    </button>
  );
}

/** A labeled row inside the mobile BottomSheet — pairs a field's pill
 * control (or a switch, same as SettingRow) with its name, since the pill
 * alone (icon + value, no label) doesn't carry enough context once it's not
 * sitting in a labeled toolbar. Unlike SettingRow (used in the desktop-only
 * SettingsPopover dropdown, where the panel edge already implies grouping),
 * this draws its own border so a long stack of rows in a full-height sheet
 * still reads as a list. */
export function MobileFieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-label text-ink-soft">{label}</p>
        {description && <p className="mt-0.5 text-caption text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
