import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, User, Sparkles, Shield } from "lucide-react";
import logoImage from "@/assets/tuppafrica-logo.jpg";
import heroImage from "@/assets/hero-tupperware.jpg";

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(100, { message: "Password must be less than 100 characters" });
const nameSchema = z.string().trim().min(1, { message: "Name cannot be empty" }).max(100, { message: "Name must be less than 100 characters" });

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get("redirect") || "/";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  // Redirect if already logged in — go to intended destination
  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message || "An error occurred during sign in");
      }
    } else {
      // Navigate to the intended destination (e.g. /admin)
      navigate(redirectTo, { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered");
      } else {
        toast.error(error.message || "An error occurred during sign up");
      }
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 select-none font-sans bg-cover bg-center"
      style={{ 
        backgroundImage: `url(${heroImage})` 
      }}
    >
      {/* Blue tinted overlay matching the website's brand tone */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-sky-900/60 to-teal-900/50 backdrop-blur-[4px] pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="relative w-full max-w-[390px] z-10 transition-all duration-300">
        
        {/* Floating return button */}
        <button
          onClick={() => navigate("/")}
          className="absolute -top-9 left-0 flex items-center gap-1 text-xs font-semibold text-white/95 hover:text-white hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5 drop-shadow" />
          Back to Store
        </button>

        {/* Outer card glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-25" />

        {/* White Glass Card */}
        <div className="relative rounded-2xl bg-white/95 border border-white/40 px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
          
          {/* Header branding */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="relative mb-2 p-1.5 rounded-xl bg-white border border-slate-200/50 shadow-sm">
              {logoImage ? (
                <img src={logoImage} alt="TuppAfrica Logo" className="h-8 w-auto rounded object-contain" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              TuppAfrica
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Premium bottle and container collections.
            </p>
          </div>

          {/* Frosted Tab Switcher */}
          <div className="flex p-0.5 mb-4 rounded-lg bg-slate-100 border border-slate-200/50">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                activeTab === "signup"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="transition-all duration-300">
            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 h-9.5 bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/60 focus:ring-primary/20 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="login-password" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 h-9.5 bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/60 focus:ring-primary/20 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.01] shadow-md shadow-primary/10 mt-4 text-xs"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 h-9.5 bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/60 focus:ring-primary/20 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 h-9.5 bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/60 focus:ring-primary/20 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 h-9.5 bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/60 focus:ring-primary/20 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.01] shadow-md shadow-primary/10 mt-4 text-xs"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
          </div>

          <div className="mt-5 text-center">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1 font-semibold">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Secure Authentication by Supabase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
