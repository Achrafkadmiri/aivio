import { Marquee } from "@/components/marketing/marquee";
import { VIDEO_MODELS, IMAGE_MODELS } from "@/lib/constants";

const ALL_MODELS = [...VIDEO_MODELS, ...IMAGE_MODELS];

export function ModelStrip() {
  return (
    <div className="border-y border-line bg-surface-2/50 py-8">
      <p className="text-center text-caption text-muted">Powered by state-of-the-art models</p>
      <Marquee className="mt-4">
        {ALL_MODELS.map((model) => (
          <span
            key={model.id}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 whitespace-nowrap"
          >
            <span className="font-mono text-caption text-ink-soft">{model.label}</span>
            <span className="text-caption text-muted">· {model.provider}</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
