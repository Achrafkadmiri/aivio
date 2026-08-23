import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { GradientGlow } from "@/components/marketing/gradient-glow";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";

// The one clip not yet spotlighted anywhere else on the page — used here,
// dimmed behind the card, so the page closes on real motion rather than a
// flat panel.
const CLOSING_VIDEO = SHOWCASE_VIDEOS.find((v) => v.id === "reference-scene")!;

export function CtaSection() {
  return (
    <section className="container-page relative py-20 sm:py-28">
      <GradientGlow className="opacity-60" />
      <Reveal className="relative">
        <Card
          variant="feature"
          className="relative flex flex-col items-center gap-6 overflow-hidden border-brand/30 text-center shadow-glow-md"
        >
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={CLOSING_VIDEO.url} type="video/mp4" />
          </video>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-2 via-surface-2/80 to-surface-2/40"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center gap-6">
            <h2 className="text-heading font-bold text-ink">
              Ready to create your <span className="text-gradient">first video</span>?
            </h2>
            <p className="max-w-lg text-body text-muted">
              Start free with 50 credits — no credit card required.
            </p>
            <Link href="/signup" className={buttonVariants()}>
              Start creating free
            </Link>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
