import { cn } from "@/lib/utils";

/**
 * The "your render is happening" visual for the generate page.
 *
 * Deliberately NOT a spinner + percentage bar: the provider reports progress
 * in coarse jumps and parks at 0 for most of a render, so the bar spent its
 * time either frozen or lying. This shows the *thing being made* instead — a
 * miniature film frame for video, a photo frame for image — with a block of
 * latent tiles resolving out of noise under a render scan pass. Nothing here
 * claims to know how far along the job is; it only says "a model is painting
 * this right now", which is the one thing we can honestly show.
 *
 * Every layer animates transform/opacity only and is gated on motion-safe:,
 * so a reduced-motion user gets the same composition, held still.
 */

/** Grid density per modality — 16:9 gets a wider, shorter tile field. */
const GRID = {
  video: { cols: 12, rows: 7 },
  image: { cols: 9, rows: 9 },
} as const;

/** Tile cycle length in ms; delays below are spread across it. */
const CELL_CYCLE = 2600;

function LatentField({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div
      className="absolute inset-0 grid gap-[3px] p-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // Diagonal wave: delay grows with row+col so brightness travels
        // corner to corner. Negative so every tile starts mid-cycle — no
        // dead beat on first paint while the wave winds up.
        const delay = -(((row + col) * 130) % CELL_CYCLE);
        // Deterministic (not random) accent scatter: hydration has to match,
        // and a fixed pattern reads as structure emerging rather than static.
        const seed = (col * 3 + row * 5) % 17;
        return (
          <span
            key={i}
            className={cn(
              "rounded-[2px] opacity-25 motion-safe:animate-latent-cell",
              // Sparse on purpose — a handful of colour among mostly neutral
              // tiles reads as detail emerging; colouring more of them just
              // looks like confetti.
              seed === 0
                ? "bg-brand"
                : seed === 6
                  ? "bg-brand-soft"
                  : seed === 11
                    ? "bg-accent-teal"
                    : "bg-white/45",
            )}
            style={{ animationDelay: `${delay}ms` }}
          />
        );
      })}
    </div>
  );
}

/** Viewfinder corners — L-brackets that breathe, one per corner. */
function Reticle() {
  return (
    <div className="pointer-events-none absolute inset-2" aria-hidden="true">
      {[
        "left-0 top-0 border-l-2 border-t-2 rounded-tl-md",
        "right-0 top-0 border-r-2 border-t-2 rounded-tr-md",
        "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-md",
        "right-0 bottom-0 border-b-2 border-r-2 rounded-br-md",
      ].map((corner, i) => (
        <span
          key={corner}
          className={cn(
            "absolute size-3 border-brand motion-safe:animate-reticle-breathe",
            corner,
          )}
          // Staggered so the four corners ripple round the frame instead of
          // flashing in unison.
          style={{ animationDelay: `${i * 320}ms` }}
        />
      ))}
    </div>
  );
}

/** Film sprocket rail — the dots creep by, so the strip reads as running. */
function SprocketRail({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-x-0 flex h-2 items-center overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* 14px pitch (6px dot + 8px gap) must match film-advance's translate
        * distance in globals.css, or the loop jumps every cycle. */}
      <div className="flex shrink-0 gap-2 motion-safe:animate-film-advance">
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} className="size-1.5 shrink-0 rounded-[1px] bg-white/25" />
        ))}
      </div>
    </div>
  );
}

/** Aperture iris for the image frame — dashed ring turning over the field. */
function Iris() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 text-brand opacity-70 motion-safe:animate-iris-spin"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="26 18"
      />
      {/* Six blades, drawn as a rotated hexagon — the classic aperture
        * silhouette, kept as an outline so the tiles stay visible through it. */}
      <path
        d="M50 22 74 36 74 64 50 78 26 64 26 36Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GenerationLoader({
  isVideo,
  className,
}: {
  isVideo: boolean;
  className?: string;
}) {
  const { cols, rows } = isVideo ? GRID.video : GRID.image;

  return (
    <div className={cn("relative flex w-full justify-center", className)} aria-hidden="true">
      {/* Ambient ember bloom behind the frame — flat color + blur, no
        * gradient fill (see the palette note in globals.css). */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-brand opacity-[0.12] blur-3xl motion-safe:animate-blob-float"
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border-strong bg-surface-dark shadow-glow-md",
          // Fluid rather than fixed: this sits inside a card that narrows
          // right down on mobile, where a hard width would overflow it. The
          // max-w values look generous because the generate page renders the
          // whole card inside a [zoom:0.7] wrapper — on screen they land at
          // roughly 224px / 179px.
          isVideo ? "aspect-video w-full max-w-80" : "aspect-square w-full max-w-64",
        )}
      >
        <LatentField cols={cols} rows={rows} />

        {isVideo ? (
          <>
            {/* Render pass sweeping down the frame. The wrapper spans the
              * frame so the bar's translate is measured against the frame's
              * own height — no magic percentages tied to the bar's size. */}
            <div className="pointer-events-none absolute inset-0 motion-safe:animate-render-scan-y motion-reduce:hidden">
              <div className="h-6 w-full bg-brand/70 blur-[10px]" />
              <div className="h-px w-full bg-brand-soft" />
            </div>
            <SprocketRail className="top-0" />
            <SprocketRail className="bottom-0" />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-0 flex motion-safe:animate-render-scan-x motion-reduce:hidden">
              <div className="h-full w-6 bg-brand/70 blur-[10px]" />
              <div className="h-full w-px bg-brand-soft" />
            </div>
            <Iris />
            {/* Crop marks belong to the photo frame only — on the video
              * frame the sprocket rails already do the framing, and both at
              * once just crowds a 288px box. */}
            <Reticle />
          </>
        )}
      </div>
    </div>
  );
}
