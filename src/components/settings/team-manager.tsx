"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Users, UserPlus, X, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { useMe } from "@/hooks/use-me";
import { TIER_INFO, type Tier } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { cn, formatDate, formatCredits } from "@/lib/utils";

export const MEMBER_ROLES = ["creator", "editor", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** What each role may do, in the owner's words rather than the schema's. */
export const ROLE_BLURB: Record<MemberRole, string> = {
  creator: "Can generate, edit and publish",
  editor: "Can edit and publish, but not generate",
  viewer: "Can look, but not change anything",
};

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  /** Credits of the pool this member may spend per month; null = unlimited. */
  monthlyCreditLimit: number | null;
  /** Spent against the pool this month, derived from their generations. */
  spentThisMonth: number;
};
type Invite = { id: string; email: string; createdAt: string; expiresAt: string };
type TeamResponse =
  | { role: null }
  | { role: "owner"; organization: { id: string; name: string }; seats: number; members: Member[]; invites: Invite[] }
  | { role: "member"; organization: { id: string; name: string; ownerName: string }; members: Member[] };

/** An invite addressed to the signed-in user, waiting to be accepted. */
type MyInvite = {
  id: string;
  organizationName: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
};

/**
 * Invites waiting for this account.
 *
 * Fetched by email server-side, so joining a team never depends on finding
 * the invite email — the link still works, this is just the other door.
 */
function useMyInvites() {
  return useQuery({
    queryKey: ["my-invites"],
    queryFn: async (): Promise<MyInvite[]> => {
      const res = await apiFetch("/api/organization/invites/mine");
      if (!res.ok) throw new Error("Failed to load invites");
      return (await res.json()).invites ?? [];
    },
  });
}

/** The accept/decline panel, shown above the empty state for someone who has
 *  been invited but has no team yet. */
function PendingInvites({ invites, onChanged }: { invites: MyInvite[]; onChanged: () => void }) {
  const { toast } = useToast();

  const accept = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/organization/invites/${id}/accept`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't accept this invite.");
    },
    onSuccess: () => {
      toast({ title: "You're in", description: "You've joined the team.", variant: "success" });
      onChanged();
    },
    onError: (err: Error) =>
      toast({ title: "Couldn't join", description: err.message, variant: "error" }),
  });

  const decline = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/organization/invites/${id}/decline`, { method: "POST" });
    },
    onSuccess: onChanged,
  });

  if (invites.length === 0) return null;

  return (
    <Card variant="standard" className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-brand" aria-hidden="true" />
        <h2 className="text-subheading font-semibold text-ink">
          {invites.length === 1 ? "You've been invited" : "You've been invited to a few teams"}
        </h2>
      </div>
      <div className="divide-y divide-line">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-label text-ink-soft">{invite.organizationName}</p>
              <p className="mt-1 text-caption text-muted">
                Invited by {invite.invitedByName} — expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => decline.mutate(invite.id)}
                loading={decline.isPending}
              >
                Decline
              </Button>
              <Button onClick={() => accept.mutate(invite.id)} loading={accept.isPending}>
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted">
        Joining a team means generating against its shared credit pool, with the owner&apos;s plan.
      </p>
    </Card>
  );
}

function useTeam() {
  return useQuery({
    queryKey: ["organization"],
    queryFn: async (): Promise<TeamResponse> => {
      const res = await apiFetch("/api/organization");
      if (!res.ok) throw new Error("Failed to load team");
      return res.json();
    },
  });
}

export function TeamManager() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data, isLoading } = useTeam();
  const { data: myInvites } = useMyInvites();
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["organization"] });
  // Accepting an invite changes the team AND what this account can do (a
  // member inherits the owner's tier), so /me has to be refetched too or the
  // sidebar keeps the old locks until a reload.
  const invalidateAfterJoin = () => {
    queryClient.invalidateQueries({ queryKey: ["organization"] });
    queryClient.invalidateQueries({ queryKey: ["my-invites"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["usage"] });
  };

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiFetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create team");
    },
    onSuccess: () => {
      toast({ title: "Team created", variant: "success" });
      invalidate();
    },
    onError: (err: Error) => toast({ title: "Couldn't create team", description: err.message, variant: "error" }),
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiFetch("/api/organization/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send invite");
    },
    onSuccess: () => {
      setInviteEmail("");
      toast({ title: "Invite sent", variant: "success" });
      invalidate();
    },
    onError: (err: Error) => toast({ title: "Couldn't send invite", description: err.message, variant: "error" }),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/organization/invites/${id}`, { method: "DELETE" });
    },
    onSuccess: invalidate,
  });

  // Role and allowance are one endpoint; either field may be sent alone.
  const updateMemberMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { role?: MemberRole; monthlyCreditLimit?: number | null };
    }) => {
      const res = await apiFetch(`/api/organization/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Couldn't update this member");
    },
    onSuccess: () => {
      toast({ title: "Member updated", variant: "success" });
      invalidate();
    },
    onError: (err: Error) =>
      toast({ title: "Couldn't update member", description: err.message, variant: "error" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/organization/members/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Member removed", variant: "success" });
      invalidate();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/organization/leave", { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "You left the team", variant: "success" });
      invalidate();
    },
  });

  if (isLoading || !data || !me) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const seats = me.tier in TIER_INFO ? TIER_INFO[me.tier as Tier].seats : 1;

  // No team yet, and this plan doesn't include extra seats — upsell rather
  // than a bare empty state, since this is the one settings page that's
  // genuinely plan-gated.
  const pending = myInvites ?? [];

  // Being invited is independent of your own plan: a free account can join a
  // Studio team, so the invite panel sits ABOVE the upsell rather than behind
  // it. Without this, the one screen an invitee is sent to would show them a
  // "buy Studio" card and no way to accept.
  if (data.role === null && seats <= 1) {
    return (
      <div className="space-y-6">
        <PendingInvites invites={pending} onChanged={invalidateAfterJoin} />
        <Card variant="standard" className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10">
          <Users className="size-5 text-brand" aria-hidden="true" />
        </span>
        <h2 className="text-subheading font-semibold text-ink">Team accounts are a Studio feature</h2>
        <p className="max-w-sm text-body-sm text-muted">
          Studio includes 3 seats — invite teammates to generate against one shared credit pool.
        </p>
          <Link href="/settings/billing" className={buttonVariants({ className: "mt-2" })}>
            View plans
          </Link>
        </Card>
      </div>
    );
  }

  if (data.role === null) {
    return (
      <div className="space-y-6">
        <PendingInvites invites={pending} onChanged={invalidateAfterJoin} />
        <Card variant="standard" className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10">
          <Users className="size-5 text-brand" aria-hidden="true" />
        </span>
        <h2 className="text-subheading font-semibold text-ink">Create your team</h2>
        <p className="max-w-sm text-body-sm text-muted">
          Your plan includes {seats} seats. Give your team a name to start inviting people.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (teamName.trim()) createMutation.mutate(teamName.trim());
          }}
          className="mt-2 flex w-full max-w-xs gap-2"
        >
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            aria-label="Team name"
          />
            <Button type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (data.role === "member") {
    return (
      <div className="space-y-6">
        <Card variant="standard">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-subheading font-semibold text-ink">{data.organization.name}</h2>
              <p className="mt-1 text-body-sm text-muted">
                You&apos;re a member — {data.organization.ownerName} owns this team and its billing.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await confirm({
                  title: `Leave ${data.organization.name}?`,
                  description:
                    "You lose access to the shared credit pool and go back to your own plan's credits. Only an owner can invite you back.",
                  confirmLabel: "Leave team",
                  tone: "danger",
                });
                if (ok) leaveMutation.mutate();
              }}
              loading={leaveMutation.isPending}
            >
              Leave team
            </Button>
          </div>
        </Card>
        <Card variant="standard" className="divide-y divide-line p-0">
          {data.members.map((m) => (
            <MemberRow key={m.id} member={m} isOwnerView={false} />
          ))}
        </Card>
      </div>
    );
  }

  // role === "owner"
  const seatsUsed = data.members.length + data.invites.length + 1; // +1 for the owner
  const seatsLeft = data.seats - seatsUsed;

  return (
    <div className="space-y-6">
      <Card variant="standard">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-subheading font-semibold text-ink">{data.organization.name}</h2>
            <p className="mt-1 text-body-sm text-muted">
              {seatsUsed} of {data.seats} seats used
            </p>
          </div>
        </div>
        {seatsLeft > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inviteEmail.trim()) inviteMutation.mutate(inviteEmail.trim());
            }}
            className="mt-4 flex gap-2"
          >
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <Button type="submit" loading={inviteMutation.isPending}>
              <UserPlus className="size-4" /> Invite
            </Button>
          </form>
        )}
      </Card>

      <Card variant="standard" className="divide-y divide-line p-0">
        <div className="flex items-center gap-2 p-4">
          <Crown className="size-3.5 text-brand" aria-hidden="true" />
          <p className="text-label text-ink-soft">{me.name} (you) — owner</p>
        </div>
        {data.members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            isOwnerView
            onUpdate={(patch) => updateMemberMutation.mutate({ id: m.id, patch })}
            onRemove={async () => {
              const ok = await confirm({
                title: `Remove ${m.name} from the team?`,
                description:
                  "They lose access to the shared credit pool right away. Their own generations are untouched, and you can re-invite them later.",
                confirmLabel: "Remove",
                tone: "danger",
              });
              if (ok) removeMemberMutation.mutate(m.id);
            }}
          />
        ))}
        {data.invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-label text-ink-soft">{invite.email}</p>
              <p className="mt-1 text-caption text-muted">
                Invited {formatDate(invite.createdAt)} — expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const ok = await confirm({
                  title: `Cancel the invite to ${invite.email}?`,
                  description: "The link they were sent stops working. You can invite them again.",
                  confirmLabel: "Cancel invite",
                  cancelLabel: "Keep it",
                });
                if (ok) cancelInviteMutation.mutate(invite.id);
              }}
              aria-label="Cancel invite"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {data.members.length === 0 && data.invites.length === 0 && (
          <p className="p-6 text-center text-body-sm text-muted">No teammates yet — invite someone above.</p>
        )}
      </Card>
    </div>
  );
}

function MemberRow({
  member,
  isOwnerView,
  onRemove,
  onUpdate,
}: {
  member: Member;
  isOwnerView: boolean;
  onRemove?: () => void;
  onUpdate?: (patch: { role?: MemberRole; monthlyCreditLimit?: number | null }) => void;
}) {
  // Local so the field can be typed in without firing a request per key;
  // committed on blur or Enter.
  const [limitDraft, setLimitDraft] = useState(
    member.monthlyCreditLimit === null ? "" : String(member.monthlyCreditLimit),
  );

  const role = (MEMBER_ROLES as readonly string[]).includes(member.role)
    ? (member.role as MemberRole)
    : "creator";

  const commitLimit = () => {
    const trimmed = limitDraft.trim();
    // Empty means unlimited, which is a real value here, not "unchanged".
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 0)) {
      setLimitDraft(member.monthlyCreditLimit === null ? "" : String(member.monthlyCreditLimit));
      return;
    }
    if (next !== member.monthlyCreditLimit) onUpdate?.({ monthlyCreditLimit: next });
  };

  const overspent =
    member.monthlyCreditLimit !== null && member.spentThisMonth >= member.monthlyCreditLimit;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-label text-ink-soft">{member.name}</p>
        <p className="mt-1 text-caption text-muted">{member.email}</p>

        {isOwnerView && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1 w-28 overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              <span
                className={cn("block h-full rounded-full", overspent ? "bg-accent" : "bg-brand")}
                style={{
                  width:
                    member.monthlyCreditLimit === null
                      ? "100%"
                      : `${Math.min(100, (member.spentThisMonth / Math.max(1, member.monthlyCreditLimit)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-caption text-muted tabular-nums">
              {member.monthlyCreditLimit === null
                ? `${formatCredits(member.spentThisMonth)} used this month`
                : `${formatCredits(member.spentThisMonth)} of ${formatCredits(member.monthlyCreditLimit)} this month`}
            </span>
          </div>
        )}
      </div>

      {isOwnerView && onUpdate && (
        <div className="flex items-center gap-2">
          <div>
            <Label htmlFor={`role-${member.id}`} className="sr-only">
              Role for {member.name}
            </Label>
            <Select
              id={`role-${member.id}`}
              value={role}
              onChange={(e) => onUpdate({ role: e.target.value as MemberRole })}
              title={ROLE_BLURB[role]}
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-28">
            <Label htmlFor={`limit-${member.id}`} className="sr-only">
              Monthly credit limit for {member.name}
            </Label>
            <Input
              id={`limit-${member.id}`}
              inputMode="numeric"
              value={limitDraft}
              placeholder="No limit"
              onChange={(e) => setLimitDraft(e.target.value)}
              onBlur={commitLimit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          </div>
        </div>
      )}

      {isOwnerView && onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove member">
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
