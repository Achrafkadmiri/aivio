import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PresetStudio } from "@/components/presets/preset-studio";
import { VIRAL_PRESETS, findPreset } from "@/lib/viral-presets";

// The catalog is a static module (see viral-presets.ts), so every preset
// route is known at build time — no reason to render these on demand.
export function generateStaticParams() {
  return VIRAL_PRESETS.map((preset) => ({ slug: preset.slug }));
}

export async function generateMetadata(
  props: PageProps<"/presets/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const preset = findPreset(slug);
  if (!preset) return { title: "Preset" };
  return { title: preset.title, description: preset.tagline };
}

export default async function PresetDetailPage(props: PageProps<"/presets/[slug]">) {
  const { slug } = await props.params;
  const preset = findPreset(slug);
  if (!preset) notFound();
  return <PresetStudio preset={preset} />;
}
