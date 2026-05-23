import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { toE164 } from "@/lib/phone";
import { getDeviceMac } from "@/lib/deviceMac";
import { useSession } from "@/hooks/useSession";
import {
  getPaymentHistoryApi,
  getSessionMeApi,
  initiatePaymentApi,
} from "@/services/backendApi";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60_000;

type PayFlowStatus = "idle" | "processing" | "polling" | "success" | "timeout";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    duration: string;
    durationMinutes: number;
    price: number;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProvisioning(
  startedAtMs: number,
  baselineExpiresAtMs: number | null,
): Promise<boolean> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const session = await getSessionMeApi();
    if (session.active) {
      const expiresMs = new Date(session.expiresAt).getTime();
      if (baselineExpiresAtMs === null || expiresMs > baselineExpiresAtMs) {
        return true;
      }
    }

    const history = await getPaymentHistoryApi();
    const provisioned = history.some(
      (p) =>
        p.provisionedAt != null &&
        new Date(p.createdAt).getTime() >= startedAtMs - 5000,
    );
    if (provisioned) return true;

    await sleep(POLL_INTERVAL_MS);
  }
  return false;
}

export const PaymentModal = ({ isOpen, onClose, plan }: PaymentModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [flowStatus, setFlowStatus] = useState<PayFlowStatus>("idle");
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const hasActiveSession = sessionData?.active === true;
  const [skipChecksConfirmed, setSkipChecksConfirmed] = useState(false);

  useEffect(() => {
    setSkipChecksConfirmed(!hasActiveSession);
  }, [hasActiveSession, isOpen]);

  useEffect(() => {
    if (!isOpen) setFlowStatus("idle");
  }, [isOpen]);

  const handlePayment = async () => {
    const cleaned = phoneNumber.replace(/\s+/g, "");
    const phone = toE164(cleaned);
    const isValidKePhone =
      /^07[0-9]{8}$/.test(cleaned) || /^\+2547[0-9]{8}$/.test(phone);
    if (!isValidKePhone) {
      toast.error("Invalid Phone Number", {
        description: "Use a valid Kenyan number e.g. 0712345678",
      });
      return;
    }

    if (hasActiveSession && !skipChecksConfirmed) {
      toast.error("Confirmation Required", {
        description: "Please confirm you want to purchase another package",
      });
      return;
    }

    setFlowStatus("processing");
    const startedAtMs = Date.now();
    const baselineExpiresAtMs =
      sessionData?.active && sessionData.session
        ? new Date(sessionData.session.expiresAt).getTime()
        : null;

    try {
      const response = await initiatePaymentApi({
        planId: plan.id,
        phone,
        macAddress: getDeviceMac(),
      });

      toast.success("STK Push Sent", { description: response.message });
      setFlowStatus("polling");

      const provisioned = await waitForProvisioning(startedAtMs, baselineExpiresAtMs);
      if (provisioned) {
        setFlowStatus("success");
        await queryClient.invalidateQueries({ queryKey: ["session"] });
        await queryClient.invalidateQueries({ queryKey: ["payments"] });
        onClose();
        return;
      }

      setFlowStatus("timeout");
      toast.error("Payment pending", {
        description: "Check your M-Pesa. If debited, contact support.",
      });
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      const description =
        err.statusCode === 409
          ? "A payment is already pending for this device."
          : err.statusCode === 503
            ? "M-Pesa service is unavailable. Try again in a few minutes."
            : err.message ?? "Payment failed. Please try again.";
      toast.error("Payment Failed", { description });
      setFlowStatus("idle");
    }
  };

  const isProcessing = flowStatus === "processing" || flowStatus === "polling";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="glass border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">M-Pesa Payment</DialogTitle>
          <DialogDescription>
            Complete your purchase of {plan.name} bundle - KSh {plan.price}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {flowStatus === "timeout" && (
            <p className="text-sm text-amber-500 border border-amber-500/40 rounded-lg p-3 bg-amber-500/10">
              Check your M-Pesa. If debited, contact support.
            </p>
          )}

          {hasActiveSession && (
            <div className="glass rounded-lg p-4 border border-amber-500/50 bg-amber-500/10 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-semibold text-amber-500">Active Package Detected</p>
                  <p className="text-xs text-muted-foreground">
                    You already have an active package. Purchasing another will add to your total
                    time.
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="skip_checks"
                      checked={skipChecksConfirmed}
                      onCheckedChange={(checked) => setSkipChecksConfirmed(checked as boolean)}
                    />
                    <label
                      htmlFor="skip_checks"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I want to purchase another package
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              M-Pesa Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-primary"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Enter your M-Pesa registered phone number
            </p>
          </div>

          <div className="glass rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold">{plan.duration}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold gradient-text">KSh {plan.price}</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isProcessing || (hasActiveSession && !skipChecksConfirmed)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl hover-scale glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {flowStatus === "polling"
              ? "Waiting for M-Pesa confirmation…"
              : flowStatus === "processing"
                ? "Sending STK Push…"
                : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
