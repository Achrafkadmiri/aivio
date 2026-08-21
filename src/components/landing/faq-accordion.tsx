"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";
import { TIER_INFO } from "@/lib/constants";

// Answers are grounded in facts stated elsewhere in this app (TIER_INFO,
// the real /settings/api-keys page, the CtaSection/StatsStrip copy) rather
// than invented claims.
const FAQS = [
  {
    question: "What models does Vixerra support?",
    answer:
      "Several video models — Seedance 2.5 and 2.0, Google's Veo 3.1, and more from ByteDance, Black Forest Labs, and xAI — and several image models, including Recraft, Stable Diffusion, and Google's Nano Banana — the model behind the example images throughout this page.",
  },
  {
    question: "What's the pricing?",
    answer: `Free starts at $0 with ${TIER_INFO.free.monthlyCredits} credits a month. Starter is $${TIER_INFO.starter.priceMonthly}/month, Pro is $${TIER_INFO.pro.priceMonthly}/month, and Enterprise is custom-priced — see the full comparison on the Pricing page.`,
  },
  {
    question: "Is there an API?",
    answer:
      "Yes. Generate an API key from Settings → API Keys once you're signed in, and call the same generation pipeline the web app uses.",
  },
  {
    question: "What file formats are supported?",
    answer: "Video exports as MP4 (MOV on select models); images export as standard PNG/JPEG files.",
  },
  {
    question: "How fast is generation?",
    answer: "Typical turnaround is under 60 seconds for a finished clip, with live progress streamed to the page.",
  },
  {
    question: "Do I need a credit card to start?",
    answer: "No — sign up and start creating free with 10 credits, no credit card required.",
  },
] as const;

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-heading font-bold text-ink">Frequently asked questions</h2>
      </Reveal>

      <div className="mx-auto mt-12 max-w-2xl space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="rounded-lg border border-line transition-colors hover:bg-surface-2">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-feature-title font-semibold text-ink">{faq.question}</span>
                <Plus
                  className={cn(
                    "size-5 shrink-0 text-muted transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                  aria-hidden="true"
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-body-sm text-muted">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
