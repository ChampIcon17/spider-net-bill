import { useQuery } from "@tanstack/react-query";
import { getSessionMeApi, type SessionMeResponse } from "@/services/backendApi";

export type ActiveSession = {
  expiresAt: string;
  provisionedAt: string | null;
  plan: { name: string };
};

export type SessionQueryData = {
  active: boolean;
  session: ActiveSession | null;
};

function mapSession(response: SessionMeResponse): SessionQueryData {
  if (!response.active) {
    return { active: false, session: null };
  }
  return {
    active: true,
    session: {
      expiresAt: response.expiresAt,
      provisionedAt: response.provisionedAt ?? null,
      plan: { name: response.plan.name },
    },
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => mapSession(await getSessionMeApi()),
    refetchInterval: 30_000,
    retry: false,
  });
}
