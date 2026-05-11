export type StorageKey =
  | "spider_user"
  | "spider_bundle"
  | "spider_transactions"
  | "spider_devices";

export type StorageEventName =
  | "spider:user-updated"
  | "spider:bundle-updated"
  | "spider:transactions-updated"
  | "spider:devices-updated";

const keyToEvent: Record<StorageKey, StorageEventName> = {
  spider_user: "spider:user-updated",
  spider_bundle: "spider:bundle-updated",
  spider_transactions: "spider:transactions-updated",
  spider_devices: "spider:devices-updated",
};

export function storageGetRaw(key: StorageKey): string | null {
  return localStorage.getItem(key);
}

export function storageSetRaw(key: StorageKey, value: string): void {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(keyToEvent[key]));
}

export function storageRemove(key: StorageKey): void {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event(keyToEvent[key]));
}

export function storageSubscribe(key: StorageKey, cb: () => void): () => void {
  const handleCustom = () => cb();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) cb();
  };

  window.addEventListener(keyToEvent[key], handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(keyToEvent[key], handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

