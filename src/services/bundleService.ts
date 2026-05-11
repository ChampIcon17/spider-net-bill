import { SpiderBundleSchema, type SpiderBundle } from "@/domain/models";
import { storageGetRaw, storageRemove, storageSetRaw } from "@/infra/storage";

export function getActiveBundle(nowMs: number): SpiderBundle | null {
  const raw = storageGetRaw("spider_bundle");
  if (!raw) return null;

  try {
    const bundle = SpiderBundleSchema.parse(JSON.parse(raw));
    if (bundle.expiryTime <= nowMs) {
      storageRemove("spider_bundle");
      return null;
    }
    return bundle;
  } catch {
    storageRemove("spider_bundle");
    return null;
  }
}

export function setBundle(bundle: SpiderBundle): void {
  storageSetRaw("spider_bundle", JSON.stringify(bundle));
}

export function clearBundle(): void {
  storageRemove("spider_bundle");
}

