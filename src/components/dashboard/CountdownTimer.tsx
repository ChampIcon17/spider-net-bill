import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computeRemainingTime } from "@/domain/billing";
import { useBundle } from "@/ui/hooks/useAppState";

export const CountdownTimer = () => {
  const bundle = useBundle();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLeft = useMemo(() => {
    if (!bundle) return null;
    const remaining = computeRemainingTime(bundle.expiryTime, nowMs);
    if (remaining.totalMs <= 0) return null;

    if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h left`;
    if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m left`;
    return `${remaining.minutes}m ${remaining.seconds}s left`;
  }, [bundle, nowMs]);

  if (!timeLeft) return null;

  return (
    <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold glow animate-glow-pulse">
      <Clock className="w-4 h-4 mr-2" />
      {timeLeft}
    </Badge>
  );
};
