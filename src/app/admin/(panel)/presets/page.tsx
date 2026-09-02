"use client";

import { Info } from "lucide-react";
import { VIRAL_PRESETS, PRESET_MODEL_ID } from "@/lib/viral-presets";
import { estimateVideoCredits } from "@/lib/credit-estimate";
import { PageHeader, Panel, Table, Th, Td, Mono } from "@/components/admin/ui";

/**
 * Read-only for now, and deliberately labelled as such.
 *
 * Presets live in src/lib/viral-presets.ts — a code constant that ships with
 * the build and is statically rendered into every /presets/[slug] route. An
 * "edit preset" button here would be a lie: there is no row to write to, and
 * making one editable means moving the catalogue into the database and
 * re-plumbing those routes.
 *
 * Usage numbers are missing for the same kind of reason: Generation records
 * the prompt but not which preset produced it, so a generation cannot be
 * attributed back to a preset at all. That needs a presetSlug column before
 * any figure shown here would mean anything.
 */
export default function AdminPresetsPage() {
  return (
    <div>
      <PageHeader
        title="Presets"
        subtitle={`${VIRAL_PRESETS.length} presets live in the current build.`}
      />

      <Panel className="mb-6 p-5">
        <p className="flex items-center gap-2 text-label font-medium text-ink-soft">
          <Info className="size-4 text-warning" aria-hidden="true" />
          Read-only — and why
        </p>
        <ul className="mt-3 space-y-2 text-body-sm text-muted">
          <li>
            <strong className="text-ink-soft">No editing.</strong> The catalogue is a code constant
            (<code className="font-mono text-caption">src/lib/viral-presets.ts</code>) baked into the
            build, so there is no row to write. Making it editable means moving presets into a
            table and re-plumbing the statically generated{" "}
            <code className="font-mono text-caption">/presets/[slug]</code> routes.
          </li>
          <li>
            <strong className="text-ink-soft">No usage stats.</strong>{" "}
            <code className="font-mono text-caption">Generation</code> stores the prompt but not
            which preset produced it, so nothing can be attributed back. That needs a{" "}
            <code className="font-mono text-caption">presetSlug</code> column first — worth adding
            before the catalogue grows, since it can&apos;t be backfilled.
          </li>
        </ul>
      </Panel>

      <Panel>
        <Table
          head={
            <>
              <Th>Preset</Th>
              <Th>Category</Th>
              <Th>Duration</Th>
              <Th>Resolution</Th>
              <Th className="text-right">Cost</Th>
              <Th>Audio</Th>
            </>
          }
        >
          {VIRAL_PRESETS.map((p) => (
            <tr key={p.slug}>
              <Td>
                <span className="text-ink">{p.title}</span>
                <Mono className="block">{p.slug}</Mono>
              </Td>
              <Td>
                <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 text-caption">
                  {p.category}
                </span>
              </Td>
              <Td>{p.duration}s</Td>
              <Td><Mono>{p.resolution}</Mono></Td>
              <Td className="text-right text-accent-amber">
                {estimateVideoCredits(PRESET_MODEL_ID, p.duration, p.resolution)}
              </Td>
              <Td><Mono>{p.generateAudio ? "on" : "off"}</Mono></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
