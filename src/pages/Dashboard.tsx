import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Wifi } from "lucide-react";
import { SpiderLogo } from "@/components/SpiderLogo";
import { BuyDataTab } from "@/components/dashboard/BuyDataTab";
import { DeviceManagementTab } from "@/components/dashboard/DeviceManagementTab";
import { TransactionsTab } from "@/components/dashboard/TransactionsTab";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { logout } from "@/controllers/appController";
import { useUser } from "@/ui/hooks/useAppState";
import { logoutApi } from "@/services/backendApi";

const Dashboard = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/");
    }

    // Apply theme
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, navigate, user]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-navy-dark/20 to-background spider-web-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/30 rounded-full blur-3xl animate-pulse dashboard-blob-delay-1" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse dashboard-blob-delay-2" />
      </div>
      {/* Header */}
      <header className="glass border-b border-primary/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SpiderLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold gradient-text">SPIDER</h1>
                <p className="text-xs text-muted-foreground">Wi-Fi Management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CountdownTimer />
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full border-primary/30 hover:bg-primary/10"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="rounded-full border-primary/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="buy-data" className="space-y-6">
          <TabsList className="glass w-full justify-start overflow-x-auto border border-primary/20 p-1">
            <TabsTrigger
              value="buy-data"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              <Wifi className="mr-2 h-4 w-4" />
              Buy Data
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              Device Management
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy-data" className="animate-fade-in">
            <BuyDataTab />
          </TabsContent>

          <TabsContent value="devices" className="animate-fade-in">
            <DeviceManagementTab />
          </TabsContent>

          <TabsContent value="transactions" className="animate-fade-in">
            <TransactionsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
