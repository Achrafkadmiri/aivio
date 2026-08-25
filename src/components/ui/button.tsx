import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "circular" | "gradient";
export type ButtonSize = "default" | "sm" | "icon" | "icon-circular";

// Focus ring comes from the global :focus-visible rule in globals.css —
// no need to repeat it on every interactive primitive. font-display (Space
// Grotesk) rather than the body sans gives every button in the app the
// same bit of typographic character as the headlines, so CTAs read as
// "designed" even in plain lists of Cancel/Save actions.
const base =
  "font-display inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-label font-semibold " +
  "transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out disabled:pointer-events-none disabled:opacity-40";

// primary = solid white pill, black text — brand-ember never fills a
// button, it's reserved for text/badge/link accents (see globals.css) so
// it stays legible as emphasis rather than becoming the default chrome.
// secondary = ghost pill: transparent + translucent white border.
// gradient = the one deliberate exception to "brand never fills a button":
// reserved for the single highest-emphasis CTA on a screen (hero, generate
// submit, upgrade/recharge) so it doesn't compete with the white primary
// pill.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-0 bg-white text-black shadow-[0_0_20px_rgb(255_255_255_/_0.1)] hover:bg-white/90 hover:shadow-[0_0_30px_rgb(255_255_255_/_0.15)] hover:scale-[1.02] active:scale-[0.98] disabled:bg-line disabled:text-muted disabled:shadow-none disabled:hover:scale-100",
  secondary:
    "border border-line bg-transparent text-ink hover:bg-white/5 hover:border-border-strong active:scale-[0.98] disabled:text-muted",
  ghost:
    "rounded-full border-0 bg-transparent text-ink-soft hover:bg-white/8 hover:text-ink active:bg-white/12",
  circular:
    "border-0 rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-ink-soft active:scale-95",
  gradient:
    "border-0 bg-[image:var(--gradient-primary)] text-white shadow-glow-md hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100",
};

const sizes: Record<ButtonSize, string> = {
  default: "px-7 py-3.5 sm:px-6 sm:py-3",
  sm: "px-4 py-2",
  icon: "size-11 p-0 sm:size-10",
  "icon-circular": "size-11 p-0 sm:size-9",
};

export function buttonVariants(
  options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
) {
  const { variant = "primary", size = "default", className } = options;
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
