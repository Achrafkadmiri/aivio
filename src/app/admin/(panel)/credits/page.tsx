"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAdminCredits } from "@/hooks/use-admin-data";
import { CREDIT_VALUE_USD } from "@/lib/constants";
import {
  PageHeader, Panel, Table, Th, Td, Mono, Pagination,
  EmptyRow, LoadingBlock, ErrorBlock, formatDate,
} from "@/components/admin/ui";

const LIMIT = 50;

export default function AdminCreditsPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, error } = useAdminCredits({ limit: LIMIT, offset });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) return <ErrorBlock message={(error as Error)?.message} />;

  const { totals, bySource, grants, total } = data;
  const balanced = totals.drift === 0;

  return (
    <div>
      <PageHeader
        title="Credits"
        subtitle="Every grant ever issued, and whether the ledger still adds up."
      />

      {/* The reconciliation check. granted and spent come from two independent
          tables, so a non-zero drift means one of them lost track — this is
          the only place in the product that would notice. */}
      <div
        className={`mb-6 rounded-2xl border p-5 ${
          balanced ? "border-line bg-surface-2" : "border-accent/40 bg-accent/10"
        }`}
      >
        <p className="flex items-center gap-2 text-label font-medium text-ink-soft">
          {balanced ? (
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-4 text-accent" aria-hidden="true" />
          )}
          Reconciliation
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Granted", value: totals.granted, note: "All CreditGrant.amount" },
            { label: "Remaining", value: totals.remaining, note: "Unspent balance" },
            { label: "Spent", value: totals.spent, note: "Non-failed generations" },
            {
              label: "Drift",
              value: totals.drift,
              note: balanced ? "Ledger balances" : "granted − remaining − spent",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-caption tracking-wide text-muted uppercase">{s.label}</p>
              <p
                className={`font-display mt-1 text-subheading font-bold ${
                  s.label === "Drift" && !balanced ? "text-accent" : "text-ink"
                }`}
              >
                {s.value.toLocaleString()}
              </p>
              <p className="text-caption text-muted">{s.note}</p>
            </div>
          ))}
        </div>
        {!balanced && (
          <p className="mt-4 text-body-sm text-accent">
            The two records disagree by {Math.abs(totals.drift).toLocaleString()} credits
            (≈${(Math.abs(totals.drift) * CREDIT_VALUE_USD).toFixed(2)}). Likely a double refund or
            a deduction that didn&apos;t land — check the refund-sourced grants below.
          </p>
        )}
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-label font-medium text-ink-soft">By source</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {bySource.map((s) => (
            <div key={s.source} className="rounded-2xl border border-line bg-surface-2 p-4">
              <p className="font-mono text-caption text-brand">{s.source}</p>
              <p className="font-display mt-1.5 text-feature-title font-bold text-ink">
                {s.amount.toLocaleString()}
              </p>
              <p className="text-caption text-muted">
                {s.grants} grants · {s.remaining.toLocaleString()} left
              </p>
            </div>
          ))}
        </div>
      </section>

      <Panel>
        <Table
          head={
            <>
              <Th>User</Th>
              <Th>Source</Th>
              <Th>Tier</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Remaining</Th>
              <Th>Expires</Th>
              <Th>Created</Th>
            </>
          }
        >
          {grants.length === 0 ? (
            <EmptyRow colSpan={7}>No grants yet.</EmptyRow>
          ) : (
            grants.map((g) => (
              <tr key={g.id} className="transition-colors hover:bg-white/[0.03]">
                <Td>
                  <Link href={`/admin/users/${g.userId}`} className="hover:underline">
                    <Mono>{g.userEmail}</Mono>
                  </Link>
                </Td>
                <Td>
                  <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-mono text-caption">
                    {g.source}
                  </span>
                </Td>
                <Td className="capitalize">{g.tier}</Td>
                <Td className="text-right">{g.amount.toLocaleString()}</Td>
                <Td className="text-right text-accent-amber">{g.remaining.toLocaleString()}</Td>
                <Td><Mono>{g.expiresAt ? formatDate(g.expiresAt) : "never"}</Mono></Td>
                <Td><Mono>{formatDate(g.createdAt)}</Mono></Td>
              </tr>
            ))
          )}
        </Table>
        <Pagination total={total} limit={LIMIT} offset={offset} onOffset={setOffset} />
      </Panel>
    </div>
  );
}
