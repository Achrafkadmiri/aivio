"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easing } from "@/lib/animations";
import type { GuideArt as GuideArtKind } from "@/lib/page-guides";

/**
 * The animated illustration beside a guide's steps.
 *
 * Abstract on purpose: these are diagrams of a screen's shape, not
 * screenshots of it. A screenshot goes stale the first time a button moves
 * and quietly starts lying; a shape stays true, and it survives being 200px
 * wide. Everything is built from the app's own surfaces and the signal set
 * (see globals.css) so the panel reads as part of the product.
 *
 * Motion is ambient and looping — it runs while the panel is open and stops
 * dead under prefers-reduced-motion, where every piece still reads as a
 * finished, static composition.
 */

// -------------------------------------------------------------- primitives

function Plate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-center gap-2 overflow-hidden rounded-xl border border-line bg-surface-dark p-4">
      {children}
    </div>
  );
}

function Bar({ w, tone = "line" }: { w: string; tone?: "line" | "ink" | "brand" | "amber" }) {
  const tones = {
    line: "bg-white/10",
    ink: "bg-white/25",
    brand: "bg-brand",
    amber: "bg-accent-amber",
  } as const;
  return <span className={`block h-1.5 rounded-full ${tones[tone]}`} style={{ width: w }} />;
}

function Tile({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block rounded-md border border-line bg-gradient-to-br from-white/12 to-transparent ${className}`}
    />
  );
}

/** Shared ambient loop — one vocabulary, so the set feels like a set.
 *  Not `as const`: Framer's keyframe arrays have to stay mutable. */
const pulse = {
  animate: { opacity: [0.45, 1, 0.45] },
  transition: { duration: 2.6, repeat: Infinity, ease: easing.smooth },
};

// ------------------------------------------------------------------- scenes

function Composer({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-semibold text-on-brand">
          Seedance 2.5
        </span>
        <span className="text-[9px] font-medium text-accent-amber">113 cr</span>
      </div>
      <div className="mt-1 space-y-1.5 rounded-lg border border-border-subtle bg-surface-2 p-2.5">
        <Bar w="88%" tone="ink" />
        {still ? (
          <Bar w="54%" />
        ) : (
          <motion.span
            className="block h-1.5 rounded-full bg-white/10"
            animate={{ width: ["12%", "62%", "12%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: easing.smooth }}
          />
        )}
      </div>
      <div className="mt-1 flex gap-1.5">
        {["5s", "720p", "9:16"].map((t) => (
          <span
            key={t}
            className="rounded-full border border-line px-2 py-0.5 text-[9px] text-muted"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
        {still ? (
          <span className="block h-full w-2/3 rounded-full bg-brand" />
        ) : (
          <motion.span
            className="block h-full rounded-full bg-brand"
            animate={{ width: ["8%", "100%"] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: easing.snappy }}
          />
        )}
      </div>
    </Plate>
  );
}

function Gallery({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) =>
          still ? (
            <Tile key={i} className="aspect-[4/3]" />
          ) : (
            <motion.span
              key={i}
              className="block aspect-[4/3] rounded-md border border-line bg-gradient-to-br from-white/12 to-transparent"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: easing.smooth,
                delay: i * 0.22,
              }}
            />
          ),
        )}
      </div>
    </Plate>
  );
}

function Timeline({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="relative space-y-1.5 rounded-lg border border-border-subtle bg-surface-2 p-2">
        <div className="flex gap-1">
          {[3, 2, 4, 2].map((flex, i) => (
            <span
              key={i}
              style={{ flex }}
              className={`h-6 rounded border bg-gradient-to-br from-white/12 to-transparent ${
                i === 2 ? "border-brand" : "border-line"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <span className="h-3 flex-[2] rounded border border-accent-hot/40 bg-accent-hot/15" />
          <span className="h-3 flex-[5] rounded border border-accent-amber/30 bg-accent-amber/10" />
        </div>
        {still ? (
          <span className="absolute inset-y-1 left-1/3 w-0.5 rounded bg-brand" />
        ) : (
          <motion.span
            className="absolute inset-y-1 w-0.5 rounded bg-brand"
            animate={{ left: ["6%", "92%"] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </Plate>
  );
}

function Presets({ still }: { still: boolean }) {
  const cats = ["Trending", "Portrait", "Product"];
  return (
    <Plate>
      <div className="flex gap-1.5">
        {cats.map((c, i) => (
          <span
            key={c}
            className={`rounded-full px-2 py-0.5 text-[9px] ${
              i === 0
                ? "bg-brand font-semibold text-on-brand"
                : "border border-accent-orange/40 text-accent-orange"
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) =>
          still ? (
            <Tile key={i} className="aspect-video" />
          ) : (
            <motion.span
              key={i}
              className="block aspect-video rounded-md border border-line bg-gradient-to-br from-white/12 to-transparent"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: easing.smooth,
                delay: i * 0.3,
              }}
            />
          ),
        )}
      </div>
    </Plate>
  );
}

function Publish({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="flex gap-1.5">
        {["TT", "IG", "YT", "FB"].map((p, i) =>
          still ? (
            <span
              key={p}
              className={`flex h-7 flex-1 items-center justify-center rounded-md border text-[9px] ${
                i < 3 ? "border-brand/50 text-brand" : "border-line text-tertiary"
              }`}
            >
              {p}
            </span>
          ) : (
            <motion.span
              key={p}
              className={`flex h-7 flex-1 items-center justify-center rounded-md border text-[9px] ${
                i < 3 ? "border-brand/50 text-brand" : "border-line text-tertiary"
              }`}
              animate={i < 3 ? { opacity: [0.5, 1, 0.5] } : undefined}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: easing.smooth,
                delay: i * 0.25,
              }}
            >
              {p}
            </motion.span>
          ),
        )}
      </div>
      <div className="mt-1 space-y-1.5 rounded-lg border border-border-subtle bg-surface-2 p-2.5">
        <Bar w="76%" tone="ink" />
        <Bar w="42%" tone="brand" />
      </div>
      <div className="mt-1 flex justify-end">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-[9px] font-semibold text-on-brand">
          Publish
        </span>
      </div>
    </Plate>
  );
}

function Credits({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="flex items-baseline gap-1">
        {still ? (
          <span className="font-display text-2xl font-bold text-accent-amber">1,000</span>
        ) : (
          <motion.span className="font-display text-2xl font-bold text-accent-amber" {...pulse}>
            1,000
          </motion.span>
        )}
        <span className="text-[9px] text-muted">credits</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        {still ? (
          <span className="block h-full w-2/3 rounded-full bg-accent-amber" />
        ) : (
          <motion.span
            className="block h-full rounded-full bg-accent-amber"
            animate={{ width: ["30%", "78%", "30%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: easing.smooth }}
          />
        )}
      </div>
      <div className="mt-2 flex items-end gap-1">
        {[40, 62, 34, 78, 52, 88, 46].map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-white/12"
            style={{ height: `${h * 0.3}px` }}
          />
        ))}
      </div>
    </Plate>
  );
}

function Share({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Tile key={i} className="aspect-square" />
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5">
        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
        {still ? (
          <Bar w="70%" tone="brand" />
        ) : (
          <motion.span
            className="block h-1.5 rounded-full bg-brand"
            animate={{ width: ["30%", "70%", "30%"] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: easing.smooth }}
          />
        )}
      </div>
    </Plate>
  );
}

function Team({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-2 py-1.5"
          >
            {still || i !== 2 ? (
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                  i === 0 ? "bg-brand text-on-brand" : "bg-white/10 text-muted"
                }`}
              >
                {i === 0 ? "O" : "M"}
              </span>
            ) : (
              <motion.span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-muted"
                {...pulse}
              >
                +
              </motion.span>
            )}
            <Bar w={i === 0 ? "62%" : "44%"} />
          </div>
        ))}
      </div>
    </Plate>
  );
}

function Keys({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="space-y-1.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-2.5 py-2"
          >
            <span className="font-mono text-[9px] text-brand">vx_</span>
            <span className="flex flex-1 gap-0.5">
              {Array.from({ length: 14 }).map((_, d) =>
                still ? (
                  <span key={d} className="size-1 rounded-full bg-white/20" />
                ) : (
                  <motion.span
                    key={d}
                    className="size-1 rounded-full bg-white/20"
                    animate={{ opacity: [0.25, 0.9, 0.25] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: easing.smooth,
                      delay: d * 0.06 + i * 0.3,
                    }}
                  />
                ),
              )}
            </span>
          </div>
        ))}
      </div>
    </Plate>
  );
}

function Account({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="space-y-2">
        {["68%", "84%", "52%"].map((w, i) => (
          <div key={i} className="space-y-1">
            <Bar w="26%" />
            <div className="rounded-md border border-border-subtle bg-surface-2 px-2 py-1.5">
              {still || i !== 1 ? (
                <Bar w={w} tone="ink" />
              ) : (
                <motion.span className="block h-1.5 rounded-full bg-white/25" {...pulse} style={{ width: w }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </Plate>
  );
}

function Admin({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 rounded-md border border-border-subtle bg-surface-2 p-1.5">
            <Bar w="52%" />
            <span className="mt-1 block font-display text-xs font-bold text-ink">
              {["1.2k", "98%", "14"][i]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 border-b border-border-subtle pb-1">
            {still || i !== 0 ? (
              <span
                className={`size-1.5 rounded-full ${i === 0 ? "bg-accent-hot" : "bg-white/20"}`}
              />
            ) : (
              <motion.span className="size-1.5 rounded-full bg-accent-hot" {...pulse} />
            )}
            <Bar w={["58%", "44%", "66%", "38%"][i]} />
          </div>
        ))}
      </div>
    </Plate>
  );
}

function Welcome({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="relative flex items-center justify-center py-2">
        {!still && (
          <motion.span
            className="absolute size-16 rounded-full border border-brand/40"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: easing.smooth }}
          />
        )}
        <span className="absolute size-16 rounded-full border border-line" />
        <span className="font-display text-lg font-bold tracking-tight text-ink">
          V<span className="text-brand">.</span>
        </span>
      </div>
      <div className="flex justify-center gap-1.5">
        {["Prompt", "Cut", "Publish"].map((t) => (
          <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[9px] text-muted">
            {t}
          </span>
        ))}
      </div>
    </Plate>
  );
}

function Auth({ still }: { still: boolean }) {
  return (
    <Plate>
      <div className="mx-auto w-full max-w-[150px] space-y-2 rounded-lg border border-border-subtle bg-surface-2 p-3">
        <div className="flex justify-center">
          <span className="flex size-6 items-center justify-center rounded-full border border-brand/40">
            <span className="size-1.5 rounded-full bg-brand" />
          </span>
        </div>
        <div className="space-y-1.5">
          <Bar w="100%" />
          <Bar w="100%" />
        </div>
        {still ? (
          <span className="block h-4 w-full rounded-md bg-brand" />
        ) : (
          <motion.span className="block h-4 w-full rounded-md bg-brand" {...pulse} />
        )}
      </div>
    </Plate>
  );
}

// ------------------------------------------------------------------ export

const SCENES: Record<GuideArtKind, (p: { still: boolean }) => React.ReactElement> = {
  composer: Composer,
  gallery: Gallery,
  timeline: Timeline,
  presets: Presets,
  publish: Publish,
  credits: Credits,
  share: Share,
  team: Team,
  keys: Keys,
  account: Account,
  admin: Admin,
  welcome: Welcome,
  auth: Auth,
};

export function GuideArt({ kind }: { kind: GuideArtKind }) {
  const reduced = useReducedMotion();
  const Scene = SCENES[kind];
  return <Scene still={Boolean(reduced)} />;
}
