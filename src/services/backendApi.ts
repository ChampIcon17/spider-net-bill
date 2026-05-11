import { apiFetch, clearAuthTokens, setAuthTokens } from "@/lib/apiClient";

export type PublicUser = {
  id: string;
  phone: string;
  name?: string | null;
  role: string;
  createdAt?: string;
};

type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export async function loginApi(phone: string, password: string): Promise<PublicUser> {
  const payload = await apiFetch<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    },
    { auth: false, retryOn401: false },
  );
  setAuthTokens(payload.accessToken, payload.refreshToken);
  return payload.user;
}

export async function registerApi(
  phone: string,
  password: string,
  name?: string,
): Promise<PublicUser> {
  const payload = await apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ phone, password, name }),
    },
    { auth: false, retryOn401: false },
  );
  setAuthTokens(payload.accessToken, payload.refreshToken);
  return payload.user;
}

export async function logoutApi(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem("spider_refresh_token");
    if (refreshToken) {
      await apiFetch(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        { auth: true, retryOn401: false },
      );
    }
  } finally {
    clearAuthTokens();
  }
}

export async function initiatePaymentApi(input: {
  planId: string;
  macAddress: string;
  phone?: string;
}): Promise<{ checkoutRequestId: string; message: string }> {
  return apiFetch<{ checkoutRequestId: string; message: string }>(
    "/payments/initiate",
    {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    },
    { auth: true },
  );
}

export type PlanDto = {
  id: string;
  name: string;
  durationHours: number;
  price: number | string;
  speedLimit: string;
};

export async function listPlansApi(): Promise<PlanDto[]> {
  return apiFetch<PlanDto[]>("/plans", { method: "GET" }, { auth: false, retryOn401: false });
}
