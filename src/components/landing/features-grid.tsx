import { Video, Image as ImageIcon, Wand2, Layers, Zap, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { TiltCard } from "@/components/marketing/tilt-card";

const FEATURES = [
  {
    icon: Video,
    title: "Text & image to video",
    body: "Animate a still photo or generate video straight from a text prompt with camera and motion controls.",
    span: "lg:col-span-2",
  },
  {
    icon: ImageIcon,
    title: "Text to image",
    body: "Recraft, Stable Diffusion, and Nano Banana for photoreal, illustrated, or stylized stills in any aspect ratio.",
  },
  {
    icon: Wand2,
    title: "AI prompt enhancement",
    body: "Turn a rough idea into a detailed, model-ready prompt with one click.",
  },
  {
    icon: Zap,
    title: "Real-time progress",
    body: "Watch generation progress live via streaming updates — no refreshing, no guessing.",
  },
  {
    icon: FolderKanban,
    title: "Collections & sharing",
    body: "Organize generations into collections and share a public link with your team.",
  },
  {
    icon: Layers,
    title: "Built for scale",
    body: "Priority queues and a documented API so teams can ship campaigns, not one-offs.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="container-page py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-heading font-bold text-ink">Everything you need to create</h2>
        <p className="mt-4 text-body text-muted">One studio for every kind of AI-generated content.</p>
      </Reveal>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delayMs={(index % 3) * 100} className={feature.span}>
            <TiltCard className="h-full">
              <Card variant="feature" className="h-full transition-colors duration-300 hover:border-brand/40">
                <span className="flex size-12 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-glow-sm">
                  <feature.icon className="size-6 text-surface" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-feature-title font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-body-sm text-muted">{feature.body}</p>
              </Card>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
