import { SpiderUserSchema, type SpiderUser } from "@/domain/models";
import { storageGetRaw, storageRemove, storageSetRaw } from "@/infra/storage";
import { clearAuthTokens } from "@/lib/apiClient";

export function getCurrentUser(): SpiderUser | null {
  const raw = storageGetRaw("spider_user");
  if (!raw) return null;
  try {
    return SpiderUserSchema.parse(JSON.parse(raw));
  } catch {
    storageRemove("spider_user");
    return null;
  }
}

export function setCurrentUser(user: SpiderUser): void {
  storageSetRaw("spider_user", JSON.stringify(user));
}

export function clearCurrentUser(): void {
  storageRemove("spider_user");
  clearAuthTokens();
}

