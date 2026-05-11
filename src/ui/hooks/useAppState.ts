import { appStore } from "@/state/appState";
import { useStore } from "@/state/store";

export function useUser() {
  return useStore(appStore, (s) => s.user);
}

export function useBundle() {
  return useStore(appStore, (s) => s.bundle);
}

export function useTransactions() {
  return useStore(appStore, (s) => s.transactions);
}

export function useDevices() {
  return useStore(appStore, (s) => s.devices);
}

