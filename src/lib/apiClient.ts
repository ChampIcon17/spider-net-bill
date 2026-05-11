const RAW_BASE =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NEXT_PUBLIC_API_URL ??
  "";

const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/$/, "")}/api/v1` : "";
const ACCESS_TOKEN_KEY = "spider_access_token";
const REFRESH_TOKEN_KEY = "spider_refresh_token";

type ApiErrorShape = {
  statusCode: number;
  message: string;
  error: string;
};

type ApiFetchOptions = {
  auth?: boolean;
  retryOn401?: boolean;
  timeoutMs?: number;
};

let refreshPromise: Promise<string> | null = null;

function getToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setToken(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // no-op
  }
}

export function getAccessToken(): string | null {
  return getToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getToken(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  setToken(ACCESS_TOKEN_KEY, accessToken);
  setToken(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens(): void {
  clearTokens();
}

function normalizeError(statusCode: number, body: unknown): ApiErrorShape {
  const b = body as { message?: string | string[]; error?: string } | null;
  const msg = b?.message;
  const message = Array.isArray(msg) ? msg[0] ?? "Request failed" : msg ?? "Request failed";
  return {
    statusCode,
    message,
    error: b?.error ?? "Error",
  };
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("Missing refresh token");
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });
    const payload = (await parseJsonSafe(response)) as
      | { accessToken?: string; refreshToken?: string }
      | null;
    if (!response.ok || !payload?.accessToken || !payload?.refreshToken) {
      throw new Error("Unable to refresh session");
    }
    setAuthTokens(payload.accessToken, payload.refreshToken);
    return payload.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE) {
    throw {
      statusCode: 500,
      message: "API base URL is not configured",
      error: "ConfigurationError",
    } as ApiErrorShape;
  }

  const { auth = false, retryOn401 = true, timeoutMs = 15000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (response.status === 401 && auth && retryOn401) {
      try {
        const newToken = await refreshAccessToken();
        const retryHeaders = new Headers(init.headers ?? {});
        if (!retryHeaders.has("Content-Type") && init.body) {
          retryHeaders.set("Content-Type", "application/json");
        }
        retryHeaders.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(`${API_BASE}${path}`, {
          ...init,
          headers: retryHeaders,
          credentials: "include",
          signal: controller.signal,
        });
        const retryBody = await parseJsonSafe(retryResponse);
        if (!retryResponse.ok) {
          throw normalizeError(retryResponse.status, retryBody);
        }
        return retryBody as T;
      } catch {
        clearTokens();
        window.location.href = "/";
        throw {
          statusCode: 401,
          message: "Session expired, please login again",
          error: "Unauthorized",
        } as ApiErrorShape;
      }
    }

    const body = await parseJsonSafe(response);
    if (!response.ok) {
      throw normalizeError(response.status, body);
    }
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}
