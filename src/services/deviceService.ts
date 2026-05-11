import { SpiderDeviceListSchema, type SpiderDevice } from "@/domain/models";
import { storageGetRaw, storageSetRaw } from "@/infra/storage";

export function getDevices(): SpiderDevice[] {
  const raw = storageGetRaw("spider_devices");
  if (!raw) return [];
  try {
    return SpiderDeviceListSchema.parse(JSON.parse(raw));
  } catch {
    storageSetRaw("spider_devices", JSON.stringify([]));
    return [];
  }
}

export function setDevices(devices: SpiderDevice[]): SpiderDevice[] {
  storageSetRaw("spider_devices", JSON.stringify(devices));
  return devices;
}

