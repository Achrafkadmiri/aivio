import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SEEDANCE_MODEL_ID } from "@/lib/constants";

/**
 * Promo spotlight for Seedance 2.5. Copy is deliberately scoped to what the
 * model actually does in this app (720p, reference control, native audio —
 * see SEEDANCE_RESOLUTIONS/VIDEO_MODELS in constants.ts) rather than
 * borrowing a "1080p" / "% off" claim that doesn't match real model limits
 * or pricing — there's no discount system in this app, so nothing here
 * implies one.
 */
export function SeedancePromoBanner() {
  return (
    <section className="container-page py-4">
      <Reveal>
        <Link
          href={`/generate?model=${encodeURIComponent(SEEDANCE_MODEL_ID)}`}
          className="group relative block overflow-hidden rounded-[28px] border border-line bg-surface-2 p-8 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-glow-sm sm:p-12"
        >
          {/* Halftone dot texture, jade radial glow, and a large abstract
              "S" ribbon watermark — all decorative, no text. Keyed to
              --color-accent-teal (#6cc5b4, the cool half of the gold/jade
              brand pair) instead of the brand gold used in the hero right
              above it, so this banner reads as the same family's cool
              counterpoint rather than a repeat. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(rgb(108 197 180 / 0.5) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              maskImage: "radial-gradient(ellipse 70% 100% at 0% 50%, black, transparent)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 5% 40%, rgb(108 197 180 / 0.18), transparent 70%)",
            }}
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute top-1/2 right-0 h-[140%] w-auto -translate-y-1/2 translate-x-[15%] text-white opacity-[0.06]"
            viewBox="0 0 200 240"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M170 30C150 10 100 5 60 25C20 45 15 80 45 100C75 120 150 110 175 135C200 160 190 200 150 220C110 240 50 230 25 205"
              stroke="currentColor"
              strokeWidth="26"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand px-2.5 py-1 text-caption font-black tracking-wide text-on-brand uppercase">
                Exclusive access
              </span>
              <span className="rounded-md border border-accent-teal/40 bg-accent-teal/15 px-2.5 py-1 text-caption font-black tracking-wide text-accent-teal uppercase">
                Seedance 2.5 at 720p
              </span>
            </div>

            <h2 className="mt-4 text-heading leading-[1.05] font-black tracking-tight uppercase sm:text-display">
              <span className="block text-accent-teal">Exclusive Seedance 2.5</span>
              <span className="block text-ink">Reference control & native audio</span>
            </h2>

            <p className="mt-4 max-w-lg text-body text-muted">
              Our most capable video model yet — up to 30s, reference-conditioned shots, and
              native audio generation. Live now on every plan.
            </p>

            <span className="font-display mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-label font-semibold text-black transition-transform group-hover:translate-x-1">
              Try it now
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
