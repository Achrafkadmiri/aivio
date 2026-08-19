import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "standard" | "compact" | "feature";

const variants: Record<CardVariant, string> = {
  standard:
    "rounded-2xl border border-line bg-surface-2 p-8 shadow-card transition-[background-color,border-color,box-shadow,transform] duration-500 ease-out hover:-translate-y-2 hover:border-border-strong hover:shadow-floating",
  compact: "rounded-2xl border border-line bg-surface-2 p-6 shadow-card",
  // Doc's Feature Card spec exactly: secondary bg at rest, shifts to
  // tertiary + stronger border + bigger shadow on hover — no lift/scale.
  feature:
    "rounded-2xl border border-border-subtle bg-surface-2 px-8 py-12 text-ink transition-[background-color,border-color,box-shadow] duration-500 ease-out hover:border-border-strong hover:bg-surface-3 hover:shadow-floating",
};

export function Card({
  variant = "standard",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
