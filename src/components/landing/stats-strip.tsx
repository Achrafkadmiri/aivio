"use client";

import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { cn } from "@/lib/utils";

const STATS = [
  { target: 3, suffix: " formats", label: "Text, image & audio-guided generation" },
  { target: 60, prefix: "<", suffix: "s", label: "Typical time to a finished clip" },
  { target: 1080, suffix: "p", label: "Broadcast-ready output resolution" },
  { target: 5, suffix: " models", label: "Video & image models to choose from" },
];

// Decorative floating clip cards, tilted and pinned to the corners behind
// the stat numbers — desktop-only accent (hidden below lg so it never
// competes with the numbers on small screens). Distinct clips from every
// other spotlighted placement on the page.
const FLOATING_CLIPS = [
  { id: "man-dancing", rotate: "-rotate-6", position: "left-0 top-1/2 -translate-y-1/2 -translate-x-1/3" },
  { id: "nightclub-performer", rotate: "rotate-6", position: "right-0 top-1/2 -translate-y-1/2 translate-x-1/3" },
] as const;

function StatItem({ stat }: { stat: (typeof STATS)[number] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  const value = useCountUp(stat.target, inView);

  return (
    <div ref={ref} className="text-center">
      <p className="text-gradient text-3xl font-bold tracking-tight sm:text-heading">
        {stat.prefix}
        {value}
        {stat.suffix}
      </p>
      <p className="mt-2 text-caption text-muted">{stat.label}</p>
    </div>
  );
}

export function StatsStrip() {
  return (
    <section className="container-page relative py-16">
      {FLOATING_CLIPS.map((clip) => {
        const video = SHOWCASE_VIDEOS.find((v) => v.id === clip.id)!;
        return (
          <div
            key={clip.id}
            className={cn(
              "pointer-events-none absolute hidden aspect-[3/4] w-32 overflow-hidden rounded-2xl border border-line shadow-glow-sm lg:block",
              clip.rotate,
              clip.position,
            )}
            aria-hidden="true"
          >
            <video className="h-full w-full object-cover opacity-60" muted loop playsInline preload="metadata" autoPlay>
              <source src={video.url} type="video/mp4" />
            </video>
          </div>
        );
      })}

      <div className="relative grid grid-cols-2 gap-8 border-y border-line py-12 sm:grid-cols-4">
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}
