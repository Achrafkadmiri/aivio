"use client";

import { useSyncExternalStore } from "react";

/**
 * Which workspace the app is currently showing: your own work, or your
 * team's shared one.
 *
 * Same "external store is localStorage itself" pattern as sidebar-provider —
 * no Context, no wrapper, so the sidebar switcher, the gallery and the
 * composer can each read the live value directly.
 *
 * It is a VIEW preference, never an authorization: the server decides what a
 * workspace contains and refuses a team you aren't in, so a tampered value
 * shows you your own work rather than someone else's. It also never changes
 * who pays — a member's generations bill the team owner in either workspace.
 */
export type Workspace = "personal" | "team";

const STORAGE_KEY = "workspace";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Workspace {
  return window.localStorage.getItem(STORAGE_KEY) === "team" ? "team" : "personal";
}

// The server renders personal: localStorage doesn't exist there, and
// useSyncExternalStore reconciles the mismatch on hydration.
function getServerSnapshot(): Workspace {
  return "personal";
}

/**
 * The stored preference, which may name a team the user is no longer in.
 * Prefer `useWorkspace(hasTeam)` at call sites that know whether a team
 * exists — a stale "team" would otherwise show a permanently empty gallery.
 */
export function useStoredWorkspace(): Workspace {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The effective workspace: "team" only when there is actually a team. */
export function useWorkspace(hasTeam: boolean): Workspace {
  const stored = useStoredWorkspace();
  return hasTeam ? stored : "personal";
}

export function setWorkspace(next: Workspace) {
  window.localStorage.setItem(STORAGE_KEY, next);
  // The native "storage" event only fires in *other* tabs — dispatch it
  // manually so this tab's subscribers re-read too.
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
}

/**
 * Query suffix for a generation submit, e.g. `"?workspace=team"`.
 *
 * Read imperatively rather than through the hook because it is used inside
 * submit handlers, and it is a query parameter rather than a body field so
 * the five submit shapes in this app (two Seedance forms, the dynamic-model
 * form, the preset studio and the marketing studio) can all carry it without
 * touching their schemas.
 *
 * Every generation endpoint is a bare path with no query string of its own,
 * so a leading "?" is always correct here.
 */
export function workspaceQuery(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) === "team" ? "?workspace=team" : "";
}
