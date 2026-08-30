"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type Me = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  /** Community pen name. Null until the first time they share anonymously —
   *  it's minted on demand, not at signup. */
  nickname: string | null;
  nicknameAvatarUrl: string | null;
  tier: string;
  createdAt: string;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      return data.user;
    },
  });
}
