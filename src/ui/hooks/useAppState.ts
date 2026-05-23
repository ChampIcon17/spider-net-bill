import { useAppStore } from "@/state/appStore";

export function useUser() {
  return useAppStore((s) => s.user);
}

export function useDeviceLabels() {
  return useAppStore((s) => s.deviceLabels);
}
