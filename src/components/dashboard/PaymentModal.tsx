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
import { useToast } from "@/hooks/use-toast";
import { Smartphone, AlertTriangle } from "lucide-react";
import { purchaseBundle } from "@/controllers/appController";
import { useBundle } from "@/ui/hooks/useAppState";
import { initiatePaymentApi } from "@/services/backendApi";

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

export const PaymentModal = ({ isOpen, onClose, plan }: PaymentModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const activeBundle = useBundle();
  const hasActiveBundle = !!activeBundle;
  const [skipChecksConfirmed, setSkipChecksConfirmed] = useState(false);
  const { toast } = useToast();

  const toE164 = (value: string): string => {
    const cleaned = value.replace(/\s+/g, "");
    if (cleaned.startsWith("+254")) return cleaned;
    if (cleaned.startsWith("254")) return `+${cleaned}`;
    if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
    return cleaned;
  };

  const getStableMacAddress = (): string => {
    const key = "spider_device_mac";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const bytes = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
    bytes[0] = bytes[0]! | 0x02; // locally administered
    const mac = bytes.map((n) => n.toString(16).padStart(2, "0")).join(":");
    localStorage.setItem(key, mac);
    return mac;
  };

  useEffect(() => {
    setSkipChecksConfirmed(!hasActiveBundle);
  }, [hasActiveBundle, isOpen]);

  const handlePayment = async () => {
    const cleaned = phoneNumber.replace(/\s+/g, "");
    const phone = toE164(cleaned);
    const isValidKePhone =
      /^07[0-9]{8}$/.test(cleaned) || /^\+2547[0-9]{8}$/.test(phone);
    if (!isValidKePhone) {
      toast({
        title: "Invalid Phone Number",
        description: "Use a valid Kenyan number e.g. 0712345678",
        variant: "destructive",
      });
      return;
    }

    if (hasActiveBundle && !skipChecksConfirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm you want to purchase another package",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await initiatePaymentApi({
        planId: plan.id,
        phone,
        macAddress: getStableMacAddress(),
      });
      // Keep local UX behavior while backend webhook activates session asynchronously.
      purchaseBundle({
        planName: plan.name,
        planDuration: plan.duration,
        durationMinutes: plan.durationMinutes,
        price: plan.price,
      });
      toast({
        title: "STK Push Sent",
        description: response.message,
      });
      onClose();
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      const description =
        err.statusCode === 409
          ? "An active session already exists for this device."
          : err.statusCode === 503
            ? "M-Pesa service is unavailable. Try again in a few minutes."
            : err.message ?? "Payment failed. Please try again.";
      toast({
        title: "Payment Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Complete your purchase of {plan.name} bundle - KSh {plan.price}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {hasActiveBundle && (
            <div className="glass rounded-lg p-4 border border-amber-500/50 bg-amber-500/10 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-semibold text-amber-500">
                    Active Package Detected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You already have an active package. Purchasing another will add to your total time.
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
            disabled={isProcessing || (hasActiveBundle && !skipChecksConfirmed)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl hover-scale glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
