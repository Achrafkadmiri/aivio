"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { getPageGuide, type GuidePlan, type GuideNoteTone } from "@/lib/page-guides";
import { cn } from "@/lib/utils";

/**
 * "How do I use this screen?" — mounted once per layout, so every route
 * gets its own guide without a page having to opt in. The copy lives in
 * lib/page-guides.ts; this only decides how it is shown.
 *
 * Two placements, because the chrome differs per area:
 *   - `inline`   sits in the app shell's header, beside the credits badge.
 *   - `floating` is a fixed pill for the layouts that have no header of
 *     their own (marketing, auth, admin). It sits bottom-LEFT: BackToTop
 *     already owns bottom-right on marketing pages.
 *
 * A route with no entry renders nothing at all rather than an empty panel.
 */

const PLAN_LABEL: Record<GuidePlan, string> = {
  any: "Any plan",
  creator: "Créateur & Studio",
  studio: "Studio plan",
  staff: "Staff only",
};

// Plan badges reuse the signal set exactly as globals.css assigns it: lime
// for what a plan unlocks, hot magenta for a Studio exclusive, orange as
// the categorical slot for staff-only screens, and a plain outline where
// nothing is gated. Deliberately NOT `accent` — that token is the error
// red, and a plan badge must never read as a failure.
const PLAN_STYLE: Record<GuidePlan, { variant: "outline" | "brand"; className?: string }> = {
  any: { variant: "outline" },
  creator: { variant: "brand" },
  studio: {
    variant: "outline",
    className: "border-accent-hot/40 bg-accent-hot/10 text-accent-hot",
  },
  staff: {
    variant: "outline",
    className: "border-accent-orange/40 bg-accent-orange/10 text-accent-orange",
  },
};

const NOTE_TONE: Record<GuideNoteTone, string> = {
  info: "border-line text-muted",
  warn: "border-warning/50 text-ink-soft",
  gate: "border-brand/50 text-ink-soft",
};

export function PageGuide({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "floating";
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const guide = getPageGuide(pathname ?? "/");

  if (!guide) return null;

  const label = `How to use this page: ${guide.title}`;

  return (
    <>
      {variant === "inline" ? (
        <Tooltip content="How to use this page">
          <Button
            variant="circular"
            size="icon-circular"
            onClick={() => setOpen(true)}
            aria-label={label}
            className={className}
          >
            <HelpCircle className="size-4" aria-hidden="true" />
          </Button>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          className={cn(
            // Bottom-left, but lifted a row: BackToTop owns bottom-right,
            // and `next dev`'s own indicator badge sits at bottom-left, so
            // sitting flush there makes the button unclickable in dev.
            "fixed bottom-20 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-surface-2/90 px-4 py-2.5 text-label text-ink-soft shadow-floating backdrop-blur-md transition-colors hover:border-border-strong hover:text-ink",
            className,
          )}
        >
          <HelpCircle className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">How to use this page</span>
        </button>
      )}

      <Modal open={open} onOpenChange={setOpen} title={guide.title} description={guide.what}>
        <div className="space-y-5">
          <Badge
            variant={PLAN_STYLE[guide.plan].variant}
            className={PLAN_STYLE[guide.plan].className}
          >
            {PLAN_LABEL[guide.plan]}
          </Badge>

          <ol className="space-y-3">
            {guide.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-brand/30 text-[11px] font-medium text-brand"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-body-sm text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>

          {guide.note && (
            <p
              className={cn(
                "border-l-2 pl-3 text-caption",
                NOTE_TONE[guide.noteTone ?? "info"],
              )}
            >
              {guide.note}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
