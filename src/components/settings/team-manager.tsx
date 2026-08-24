"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Users, UserPlus, X, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useMe } from "@/hooks/use-me";
import { TIER_INFO, type Tier } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type Member = { id: string; userId: string; name: string; email: string; role: string; joinedAt: string };
type Invite = { id: string; email: string; createdAt: string; expiresAt: string };
type TeamResponse =
  | { role: null }
  | { role: "owner"; organization: { id: string; name: string }; seats: number; members: Member[]; invites: Invite[] }
  | { role: "member"; organization: { id: string; name: string; ownerName: string }; members: Member[] };

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
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data, isLoading } = useTeam();
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["organization"] });

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
  if (data.role === null && seats <= 1) {
    return (
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
    );
  }

  if (data.role === null) {
    return (
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
            <Button variant="secondary" onClick={() => leaveMutation.mutate()} loading={leaveMutation.isPending}>
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
            onRemove={() => removeMemberMutation.mutate(m.id)}
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
              onClick={() => cancelInviteMutation.mutate(invite.id)}
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
}: {
  member: Member;
  isOwnerView: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-label text-ink-soft">{member.name}</p>
        <p className="mt-1 text-caption text-muted">{member.email}</p>
      </div>
      {isOwnerView && onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove member">
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
