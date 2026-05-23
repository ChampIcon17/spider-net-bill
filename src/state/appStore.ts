import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SpiderUser } from "@/domain/models";
import { clearAuthTokens } from "@/lib/apiClient";

type AppStoreState = {
  user: SpiderUser | null;
  deviceLabels: Record<string, string>;
};

type AppStoreActions = {
  setUser: (user: SpiderUser | null) => void;
  logout: () => void;
  setDeviceLabels: (labels: Record<string, string>) => void;
};

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      deviceLabels: {},
      setUser: (user) => set({ user }),
      logout: () => {
        clearAuthTokens();
        set({ user: null });
      },
      setDeviceLabels: (deviceLabels) => set({ deviceLabels }),
    }),
    { name: "spider-app" },
  ),
);

/** One-time migration from legacy localStorage keys. */
export function migrateLegacyStorage(): void {
  try {
    const state = useAppStore.getState();
    if (!state.user) {
      const rawUser = localStorage.getItem("spider_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as SpiderUser;
        useAppStore.getState().setUser(parsed);
        localStorage.removeItem("spider_user");
      }
    }
    if (Object.keys(state.deviceLabels).length === 0) {
      const rawDevices = localStorage.getItem("spider_devices");
      if (rawDevices) {
        const devices = JSON.parse(rawDevices) as Array<{ id: string; name: string }>;
        const labels: Record<string, string> = {};
        for (const d of devices) {
          if (d?.id && d?.name) labels[d.id] = d.name;
        }
        if (Object.keys(labels).length > 0) {
          useAppStore.getState().setDeviceLabels(labels);
        }
        localStorage.removeItem("spider_devices");
      }
    }
    const legacyMac = localStorage.getItem("spider_device_mac");
    if (legacyMac && !localStorage.getItem("device_mac")) {
      localStorage.setItem("device_mac", legacyMac);
      localStorage.removeItem("spider_device_mac");
    }
    localStorage.removeItem("spider_bundle");
    localStorage.removeItem("spider_transactions");
  } catch {
    // ignore corrupt legacy data
  }
}
