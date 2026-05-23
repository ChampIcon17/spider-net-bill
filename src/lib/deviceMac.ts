const DEVICE_MAC_KEY = "device_mac";

function randomMac(): string {
  const octets = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase(),
  );
  return octets.join(":");
}

export function getDeviceMac(): string {
  const existing = localStorage.getItem(DEVICE_MAC_KEY);
  if (existing) return existing;

  const mac = randomMac();
  localStorage.setItem(DEVICE_MAC_KEY, mac);
  return mac;
}
