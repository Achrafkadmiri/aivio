import { Hero } from "@/components/landing/hero";
import { SeedancePromoBanner } from "@/components/landing/seedance-promo-banner";
import { ModelStrip } from "@/components/landing/model-strip";
import { ShowcaseGrid } from "@/components/landing/showcase-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturesShowcase } from "@/components/landing/features-showcase";
import { CapabilitiesGrid } from "@/components/landing/capabilities-grid";
import { StatsStrip } from "@/components/landing/stats-strip";
import { UseCasesGallery } from "@/components/landing/use-cases-gallery";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SeedancePromoBanner />
      <ModelStrip />

      <section id="showcase" className="container-page py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-bold text-ink">See it in action</h2>
          <p className="mt-4 text-body text-muted">
            Real output from the models behind Aivio — no cherry-picked renders, just what
            the pipeline produces.
          </p>
        </div>
        <div className="mt-12">
          <ShowcaseGrid />
        </div>
      </section>

      <CapabilitiesGrid />
      <HowItWorks />
      <FeaturesShowcase />
      <StatsStrip />
      <UseCasesGallery />
      <PricingPreview />
      <FaqAccordion />
      <CtaSection />
    </>
  );
}
