import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteNav } from "@/components/layout/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { getPendingAnalysis } from "@/lib/reports/pending";

const title = "Sign in — WebLens AI";
const description =
  "Sign in to WebLens AI to keep every website analysis on your account and reopen any report whenever you need it.";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signin" | "signup" } =>
    search.mode === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  useEffect(() => {
    if (!loading && session && !getPendingAnalysis()) {
      void navigate({ to: "/reports", replace: true });
    }
  }, [loading, navigate, session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setCheckInbox(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (getPendingAnalysis()) {
          // The claim hook attaches the pending analysis and opens the report.
          toast.success("Signed in. Unlocking your report…");
        } else {
          toast.success("Signed in. Your reports are ready.");
          void navigate({ to: "/reports" });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.toLowerCase().includes("invalid login")
          ? "That email and password don't match. Try again or create an account."
          : message || "We couldn't complete that just now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main
        id="main-content"
        className="motion-page-enter page-container page-container-narrow flex flex-col pt-28 pb-28"
      >
        <header className="pb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Account</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to reopen every analysis saved to your account."
              : "Every analysis you run is saved to your account automatically."}
          </p>
        </header>

        {checkInbox ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
            <h2 className="font-display text-lg font-semibold text-foreground">Confirm your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium">{email}</span>. Open it to
              activate your account, then sign in.
            </p>
            <Button
              variant="outline"
              className="mt-5 min-h-11 w-full rounded-full"
              onClick={() => {
                setCheckInbox(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="min-h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="min-h-12 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={busy} className="min-h-12 w-full rounded-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New to WebLens?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
