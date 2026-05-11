import type { SpiderDevice, SpiderTransaction, SpiderUser } from "@/domain/models";
import { computeExpiryTimeMs } from "@/domain/billing";
import { storageSubscribe } from "@/infra/storage";
import * as auth from "@/services/authService";
import * as bundle from "@/services/bundleService";
import * as devices from "@/services/deviceService";
import * as transactions from "@/services/transactionService";
import { appStore } from "@/state/appState";

export function hydrateAppState(): void {
  const now = Date.now();
  appStore.setState((prev) => ({
    ...prev,
    user: auth.getCurrentUser(),
    bundle: bundle.getActiveBundle(now),
    devices: devices.getDevices(),
    transactions: transactions.getTransactions(),
  }));
}

export function watchStorage(): () => void {
  const unsubs = [
    storageSubscribe("spider_user", hydrateAppState),
    storageSubscribe("spider_bundle", hydrateAppState),
    storageSubscribe("spider_devices", hydrateAppState),
    storageSubscribe("spider_transactions", hydrateAppState),
  ];
  return () => unsubs.forEach((u) => u());
}

export function login(user: SpiderUser): void {
  auth.setCurrentUser(user);
  hydrateAppState();
}

export function logout(): void {
  auth.clearCurrentUser();
  hydrateAppState();
}

export function purchaseBundle(input: {
  planName: string;
  planDuration: string;
  durationMinutes: number;
  price: number;
}): void {
  const now = Date.now();
  const expiryTime = computeExpiryTimeMs(now, input.durationMinutes);

  bundle.setBundle({
    plan: input.planName,
    expiryTime,
    purchaseTime: now,
  });

  const tx: SpiderTransaction = {
    id: now.toString(),
    plan: input.planName,
    duration: input.planDuration,
    amount: input.price,
    date: new Date(now).toISOString(),
    status: "Success",
  };

  transactions.prependTransaction(tx);
  hydrateAppState();
}

export function saveDevices(next: SpiderDevice[]): void {
  devices.setDevices(next);
  hydrateAppState();
}

