"use client";

import { useCallback, useSyncExternalStore } from "react";

// Likes live in localStorage for now: the API has no like/favorite endpoint
// (nothing on the Generation row, nothing in the routes), so there is
// nowhere to persist them server-side yet. Everything a real endpoint would
// need is already shaped here — swap the read/write pair for a query +
// mutation and the call sites don't change.
const STORAGE_KEY = "vixerra:liked-generations";

const EMPTY: ReadonlySet<string> = new Set();

// A module-level snapshot rather than per-hook state: every grid on a page
// (and the tiles inside it) then reads the same Set, and useSyncExternalStore
// gets the referentially stable value it requires between renders.
let snapshot: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

function read(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    // Private windows and "block site data" settings throw on access —
    // likes are a nice-to-have, never a reason to break the gallery.
    return EMPTY;
  }
}

function getSnapshot(): ReadonlySet<string> {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

// Server render (and the client's hydration pass) has no storage to read, so
// it must return the same stable empty Set both times.
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  // Another tab liking something should show up here too.
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      snapshot = null;
      listeners.forEach((listener) => listener());
    }
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLikedGenerations() {
  const liked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleLike = useCallback((id: string) => {
    const next = new Set(getSnapshot());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    snapshot = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore — see read()
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { liked, toggleLike };
}
