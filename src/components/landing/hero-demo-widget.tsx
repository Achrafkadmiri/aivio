"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODEL_PILLS = ["Seedance 2.5", "Seedance 2.0", "Recraft"];

/**
 * Decorative-but-convincing "try it now" widget, echoing vivideo.ai's
 * embedded hero demo. Nothing here calls the real generation API — any
 * interaction routes to /signup, and the disclaimer says so, matching the
 * honesty pattern already used on the billing/contact pages.
 */
export function HeroDemoWidget() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODEL_PILLS[0]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push("/signup");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass mx-auto mt-10 max-w-2xl rounded-2xl p-2 shadow-floating sm:p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 px-3 py-2">
          <Sparkles className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A lone astronaut walking across a rust-colored Martian plain at dusk…"
            className="w-full bg-transparent text-body-sm text-ink-soft placeholder:text-muted focus:outline-none"
          />
        </div>
        <Button type="submit" className="shrink-0">
          Generate <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line px-3 pt-3">
        <span className="text-caption text-muted">Model</span>
        {MODEL_PILLS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModel(m)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-caption transition-colors",
              model === m
                ? "border-brand bg-brand/10 text-brand"
                : "border-line text-muted hover:border-muted hover:text-ink-soft",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="mt-2 px-3 text-caption text-muted">
        Interactive preview — sign up to generate for real.
      </p>
    </form>
  );
}
