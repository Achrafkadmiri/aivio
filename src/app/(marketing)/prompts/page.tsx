import type { Metadata } from "next";
import { PromptGallery } from "@/components/marketing/prompt-gallery";

export const metadata: Metadata = {
  title: "Seedance prompts",
  description:
    "Real Seedance videos, paired with a structured shot-by-shot prompt template and full parameters. Copy one, tweak it, or open it straight in the generator.",
};

export default function PromptsPage() {
  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-heading font-bold tracking-tight text-ink sm:text-display">
          Seedance <span className="text-gradient">prompt gallery</span>
        </h1>
        <p className="mt-4 text-body text-muted">
          Real Seedance 2.0 output, each paired with a structured, shot-by-shot prompt template —
          style, duration, and a timed breakdown of the action — plus a suggested full parameter
          set (resolution, aspect ratio, camera, audio). Copy one, tweak it, or open it straight
          in the generator, fully pre-filled.
        </p>
      </div>

      <div className="mt-14">
        <PromptGallery />
      </div>
    </div>
  );
}
