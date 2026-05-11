import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, TrendingUp, Crown } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { listPlansApi } from "@/services/backendApi";
import { useToast } from "@/hooks/use-toast";

interface BundlePlan {
  id: string;
  name: string;
  duration: string;
  durationMinutes: number;
  price: number;
  icon: typeof Clock;
  popular?: boolean;
}

export const BuyDataTab = () => {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<BundlePlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plans, setPlans] = useState<BundlePlan[]>([]);

  useEffect(() => {
    let mounted = true;
    const icons = [Clock, Zap, TrendingUp, Crown] as const;
    listPlansApi()
      .then((rows) => {
        if (!mounted) return;
        const mapped = rows.map((p, idx) => ({
          id: p.id,
          name: p.name,
          duration: p.durationHours >= 24 ? `${Math.round(p.durationHours / 24)} day(s)` : `${p.durationHours} hour(s)`,
          durationMinutes: p.durationHours * 60,
          price: Number(p.price),
          icon: icons[idx % icons.length],
          popular: idx === 1,
        }));
        setPlans(mapped);
      })
      .catch((error: { message?: string }) => {
        toast({
          title: "Unable to load plans",
          description: error.message ?? "Please try again shortly",
          variant: "destructive",
        });
      });
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleBuyClick = (plan: BundlePlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold gradient-text">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select a bundle that fits your browsing needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`glass hover-scale transition-all duration-300 relative overflow-hidden ${
                plan.popular ? "border-primary glow" : "border-primary/20"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  Popular
                </Badge>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {plan.duration}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                <div>
                  <p className="text-4xl font-bold gradient-text">
                    KSh {plan.price}
                  </p>
                </div>

                <Button
                  onClick={() => handleBuyClick(plan)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl hover-scale glow transition-all duration-300"
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlan}
        />
      )}
    </div>
  );
};
