"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Eye,
  FolderOpen,
  Gauge,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lightbulb,
  Link2,
  List,
  Lock,
  Mail,
  Megaphone,
  Play,
  Scissors,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Tag,
  Type,
  Upload,
  Users,
  Video,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { easing, durations } from "@/lib/animations";
import {
  getPageGuide,
  type GuideIcon,
  type GuideNoteTone,
  type GuidePlan,
} from "@/lib/page-guides";
import { cn } from "@/lib/utils";
import { GuideArt } from "./guide-art";

/**
 * "How do I use this screen?" — mounted once per layout, so every route
 * gets a guide without a page having to opt in. The copy lives in
 * lib/page-guides.ts; this decides how it is shown.
 *
 * Shown as a walkthrough rather than a list: one step at a time, beside an
 * animated diagram of the screen. A six-step list is a wall nobody reads —
 * one step with a picture is a glance. The rail across the top is the whole
 * shape of the task, so the walkthrough never feels like a tunnel.
 *
 * Two placements, because the chrome differs per area:
 *   - `inline`   sits in the app shell's header, beside the credits badge.
 *   - `floating` is a fixed pill for the layouts with no header of their
 *     own (marketing, auth, admin).
 *
 * A route with no entry renders nothing at all rather than an empty panel.
 */

// Named in the data, resolved here: a Lucide icon is a forwardRef object
// React cannot serialize across the server/client boundary, and the data
// module is reachable from Server Components.
const ICONS: Record<GuideIcon, LucideIcon> = {
  sparkles: Sparkles,
  video: Video,
  image: ImageIcon,
  upload: Upload,
  sliders: SlidersHorizontal,
  play: Play,
  download: Download,
  folder: FolderOpen,
  share: Share2,
  send: Send,
  calendar: CalendarClock,
  zap: Zap,
  key: KeyRound,
  shield: ShieldCheck,
  users: Users,
  search: Search,
  check: Check,
  wand: Wand2,
  layers: Layers,
  clock: Clock,
  eye: Eye,
  alert: AlertTriangle,
  mail: Mail,
  lock: Lock,
  gauge: Gauge,
  scissors: Scissors,
  megaphone: Megaphone,
  list: List,
  tag: Tag,
  link: Link2,
  settings: Settings,
  coins: Coins,
  activity: Activity,
  type: Type,
};

const PLAN_LABEL: Record<GuidePlan, string> = {
  any: "Any plan",
  creator: "Créateur & Studio",
  studio: "Studio plan",
  staff: "Staff only",
};

// Plan chips reuse the signal set exactly as globals.css assigns it: lime
// for what a plan unlocks, hot magenta for a Studio exclusive, orange as
// the categorical slot for staff-only screens, and a plain outline where
// nothing is gated. Deliberately NOT `accent` — that token is the error
// red, and a plan chip must never read as a failure.
const PLAN_CHIP: Record<GuidePlan, string> = {
  any: "border-line text-muted",
  creator: "border-brand/40 bg-brand/10 text-brand",
  studio: "border-accent-hot/40 bg-accent-hot/10 text-accent-hot",
  staff: "border-accent-orange/40 bg-accent-orange/10 text-accent-orange",
};

const NOTE_TONE: Record<GuideNoteTone, string> = {
  info: "border-line/60 bg-white/[0.03] text-muted",
  warn: "border-warning/40 bg-warning/5 text-ink-soft",
  gate: "border-brand/40 bg-brand/5 text-ink-soft",
};

export function PageGuide({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "floating";
  className?: string;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const guide = getPageGuide(pathname ?? "/");

  if (!guide) return null;

  // Reopening — on this screen or another — always starts at step one.
  // Done here rather than in an effect, since opening is the only way in.
  const openPanel = () => {
    setStep(0);
    setDirection(1);
    setOpen(true);
  };

  const total = guide.steps.length;
  const current = guide.steps[step];
  const StepIcon = ICONS[current.icon];
  const atEnd = step === total - 1;

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(total - 1, next)));
  };

  const slide = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
      };

  return (
    <>
      {variant === "inline" ? (
        <Tooltip content="How to use this page">
          <Button
            variant="circular"
            size="icon-circular"
            onClick={openPanel}
            aria-label={`How to use this page: ${guide.title}`}
            className={className}
          >
            <HelpCircle className="size-4" aria-hidden="true" />
          </Button>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={openPanel}
          aria-label={`How to use this page: ${guide.title}`}
          className={cn(
            // Bottom-left, lifted a row: BackToTop owns bottom-right, and
            // `next dev`'s indicator badge sits flush at bottom-left.
            "group fixed bottom-20 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-surface-2/90 px-4 py-2.5 text-label text-ink-soft shadow-floating backdrop-blur-md transition-all hover:border-brand/50 hover:text-ink",
            className,
          )}
        >
          <HelpCircle
            className="size-4 transition-transform group-hover:scale-110 group-hover:text-brand"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">How to use this page</span>
        </button>
      )}

      <Modal open={open} onOpenChange={setOpen} className="max-w-2xl overflow-hidden p-0">
        {/* Lime bloom behind the header — the same treatment the hero uses,
            scaled to a panel. */}
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-40 w-2/3 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
          />

          <header className="relative flex items-start justify-between gap-4 px-6 pt-6">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="size-3.5 text-brand" aria-hidden="true" />
                <span className="text-caption tracking-widest text-tertiary uppercase">
                  How to use this page
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-subheading font-bold tracking-tight text-ink">
                {guide.title}
              </h2>
              <p className="mt-0.5 text-body-sm text-muted">{guide.what}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                PLAN_CHIP[guide.plan],
              )}
            >
              {PLAN_LABEL[guide.plan]}
            </span>
          </header>

          {/* Step rail — the whole shape of the task, and a way to jump. */}
          <div className="relative mt-5 flex gap-1.5 px-6">
            {guide.steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step ? "step" : undefined}
                className="group/rail flex-1 py-1"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-white/10 transition-colors group-hover/rail:bg-white/20">
                  <motion.span
                    className="block h-full rounded-full bg-brand"
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: durations.normal, ease: easing.elegant }}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="relative grid gap-5 px-6 pt-5 pb-6 sm:grid-cols-[1fr_1.1fr] sm:items-center">
            {/* Illustration */}
            <div className="order-2 h-40 sm:order-1 sm:h-44">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${guide.path}-art`}
                  className="h-full"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: durations.slow, ease: easing.elegant }}
                >
                  <GuideArt kind={guide.art} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* The one step */}
            <div className="order-1 min-h-[8.5rem] sm:order-2">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  {...slide}
                  transition={{ duration: durations.normal, ease: easing.elegant }}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
                    <StepIcon className="size-5 text-brand" aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-display text-body font-semibold text-ink">
                    {current.title}
                  </p>
                  <p className="mt-1 text-body-sm text-muted">{current.detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {guide.note && (
            <div className="px-6 pb-5">
              <p
                className={cn(
                  "flex gap-2 rounded-xl border px-3.5 py-2.5 text-caption",
                  NOTE_TONE[guide.noteTone ?? "info"],
                )}
              >
                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {guide.note}
              </p>
            </div>
          )}

          <footer className="flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-3/40 px-6 py-3.5">
            <span className="font-mono text-caption text-tertiary tabular-nums">
              {step + 1} / {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => go(step - 1)}
                disabled={step === 0}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Back
              </Button>
              {atEnd ? (
                <Button variant="accent" size="sm" onClick={() => setOpen(false)}>
                  Got it
                  <Check className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button variant="accent" size="sm" onClick={() => go(step + 1)}>
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </footer>
        </div>
      </Modal>
    </>
  );
}
