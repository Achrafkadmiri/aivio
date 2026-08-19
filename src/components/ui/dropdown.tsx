"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const DropdownRoot = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={8}
        className={cn(
          "z-50 min-w-[200px] rounded-lg border border-line bg-surface-3 py-2 text-ink shadow-floating",
          className,
        )}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function DropdownItem({ className, ...props }: ComponentProps<typeof DropdownMenu.Item>) {
  return (
    <DropdownMenu.Item
      className={cn(
        "cursor-pointer px-4 py-3 text-label text-ink-soft outline-none transition-colors",
        "data-[highlighted]:bg-dropdown-hover data-[highlighted]:text-brand",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn("px-4 py-2 text-caption text-muted", className)}
      {...props}
    />
  );
}
