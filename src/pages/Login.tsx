import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SpiderLogo } from "@/components/SpiderLogo";
import { login } from "@/controllers/appController";
import { loginApi } from "@/services/backendApi";
import { toE164 } from "@/lib/phone";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      toast.error("Error", { description: "Please fill in all fields" });
      return;
    }

    const cleaned = phone.replace(/\s+/g, "");
    const normalizedPhone = toE164(cleaned);
    const isValidKePhone =
      /^07[0-9]{8}$/.test(cleaned) || /^\+2547[0-9]{8}$/.test(normalizedPhone);
    if (!isValidKePhone) {
      toast.error("Error", { description: "Use a valid Kenyan number e.g. 0712345678" });
      return;
    }

    if (password.length < 8) {
      toast.error("Error", { description: "Password must be at least 8 characters" });
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginApi(normalizedPhone, password);
      login({ id: user.id, phone: user.phone, name: user.name ?? undefined, role: user.role });
      toast.success("Welcome to SPIDER", { description: "Login successful!" });
      navigate("/dashboard");
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      toast.error("Login failed", {
        description: err.message ?? "Unable to login right now",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="auth-hero-page min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated spider web overlay */}
      <div className="absolute inset-0 spider-web-bg opacity-30" />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark/95 via-navy-dark/85 to-primary/75" />
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="glass-form rounded-2xl p-8 shadow-2xl glow">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 animate-scale-in">
              <SpiderLogo size="lg" className="transition-transform duration-500 hover:rotate-12" />
            </div>
            <h1 className="text-3xl font-bold gradient-text uppercase tracking-[0.3em]">
              SPIDER
            </h1>
            <p className="text-foreground/70 mt-2 text-sm tracking-wide">
              Stay connected in the web
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="glass-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-6 rounded-xl hover-scale glow transition-all duration-300 uppercase tracking-wider"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚡</span>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Use your registered phone (07XXXXXXXXX) and password
            </p>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                className="text-primary hover:text-secondary transition-colors font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
