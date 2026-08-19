"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border border-line bg-surface-3 transition-colors",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-1 rounded-full bg-white transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
}
