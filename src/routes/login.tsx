import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrainCircuit,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME, useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — EduPredict AI" },
      {
        name: "description",
        content:
          "Sign in or create an account on EduPredict AI to access AI dropout risk insights.",
      },
      { property: "og:title", content: "Sign In — EduPredict AI" },
      { property: "og:description", content: "AI-Powered Student Success & Dropout Prediction." },
    ],
  }),
  component: LoginPage,
});

type AuthMode = "signin" | "signup";

const ROLE_OPTIONS: { role: Role; label: string; icon: typeof UserCog; blurb: string }[] = [
  { role: "admin", label: "Admin", icon: UserCog, blurb: "Institution-wide analytics" },
  { role: "practitioner", label: "Practitioner", icon: Users, blurb: "Mentor your students" },
  { role: "student", label: "Student", icon: UserRound, blurb: "Track your progress" },
];

const HIGHLIGHTS = [
  { icon: BrainCircuit, title: "91.4% prediction accuracy", text: "Ensemble model trained on 48,120 academic records." },
  { icon: TrendingUp, title: "Early risk detection", text: "Attendance, academics and engagement scored every night." },
  { icon: ShieldCheck, title: "Supportive by design", text: "Insights are framed to guide intervention, not to penalise." },
];

function LoginPage() {
  const { signIn, signUp, user, ready } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: ROLE_HOME[user.role], replace: true });
  }, [ready, user, navigate]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "signin"
          ? await signIn(email, password, remember)
          : await signUp(name, email, password, role, remember);

      if (!result.ok || !result.user) {
        setError(result.error ?? "Unable to continue.");
        return;
      }

      const greeting = result.user.name.split(" ")[0];
      toast.success(mode === "signin" ? `Welcome back, ${greeting}!` : `Account created, ${greeting}!`, {
        description:
          mode === "signin"
            ? "Your AI risk insights are up to date."
            : "Your account is saved in Firebase. You're signed in.",
      });
      navigate({ to: ROLE_HOME[result.user.role], replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / value panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, oklch(1 0 0 / 0.22), transparent 42%), radial-gradient(circle at 82% 78%, oklch(1 0 0 / 0.16), transparent 46%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
            <GraduationCap className="size-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-tight">EduPredict AI</p>
            <p className="text-xs text-primary-foreground/75">Student Success Intelligence</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="size-3.5" /> Predictive analytics
          </span>
          <h2 className="mt-5 font-display text-[34px] font-extrabold leading-[1.15]">
            Identify students at risk of dropping out — months before it happens.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            EduPredict AI combines attendance, academic performance, engagement and wellbeing signals into a single
            explainable risk score, so mentors can intervene while it still matters.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">
                  <h.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-xs text-primary-foreground/75">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-center">
          {[
            ["2,548", "Students monitored"],
            ["173", "Flagged at risk"],
            ["342", "Interventions logged"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
              <p className="font-display text-xl font-bold">{value}</p>
              <p className="mt-0.5 text-[11px] text-primary-foreground/75">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth form */}
      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="size-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight">EduPredict AI</p>
              <p className="text-xs text-muted-foreground">AI-Powered Student Success</p>
            </div>
          </div>

          <h1 className="mt-8 font-display text-[26px] font-bold text-foreground lg:mt-0">EduPredict AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI-Powered Student Success & Dropout Prediction</p>

          <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-5">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Register as
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setRole(opt.role)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all duration-200",
                          role === opt.role
                            ? "border-primary bg-primary-soft shadow-card"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                        )}
                      >
                        <opt.icon
                          className={cn("size-4.5", role === opt.role ? "text-primary" : "text-muted-foreground")}
                        />
                        <span className="mt-2 block text-sm font-semibold">{opt.label}</span>
                        <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">{opt.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@edupredict.ai"
                  className="rounded-xl pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl px-9"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl px-9"
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                Remember me
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Password reset link sent", {
                      description: "Check your inbox for reset instructions.",
                    })
                  }
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-critical/25 bg-critical-soft px-3 py-2.5 text-sm text-critical">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signin" ? (
                <KeyRound className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {loading
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-medium text-primary hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Accounts are stored in Firebase Authentication · profiles saved in Firestore.
          </p>
        </div>
      </section>
    </div>
  );
}
