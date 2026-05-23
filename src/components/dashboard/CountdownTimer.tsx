import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";

function formatRemaining(totalMs: number): string {
  const clamped = Math.max(0, totalMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export const CountdownTimer = () => {
  const { data } = useSession();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const label = useMemo(() => {
    if (!data?.active || !data.session) return null;
    const remaining = new Date(data.session.expiresAt).getTime() - nowMs;
    if (remaining <= 0) return null;
    return formatRemaining(remaining);
  }, [data, nowMs]);

  if (!label) return null;

  return (
    <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold glow animate-glow-pulse">
      <Clock className="w-4 h-4 mr-2" />
      {label}
    </Badge>
  );
};
