import type { SpiderUser } from "@/domain/models";
import { migrateLegacyStorage, useAppStore } from "@/state/appStore";

export function bootstrapApp(): void {
  migrateLegacyStorage();
}

export function login(user: SpiderUser): void {
  useAppStore.getState().setUser(user);
}

export function logout(): void {
  useAppStore.getState().logout();
}

export function saveDeviceLabels(labels: Record<string, string>): void {
  useAppStore.getState().setDeviceLabels(labels);
}
