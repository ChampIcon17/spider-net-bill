export type RemainingTime = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function computeRemainingTime(expiryTimeMs: number, nowMs: number): RemainingTime {
  const totalMs = Math.max(0, expiryTimeMs - nowMs);

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds };
}

export function computeExpiryTimeMs(nowMs: number, durationMinutes: number): number {
  return nowMs + durationMinutes * 60 * 1000;
}

