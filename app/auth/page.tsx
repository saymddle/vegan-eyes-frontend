"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { supabase } from "@/lib/supabase/client";
import { colors } from "@/lib/theme/colors";

type Mode = "sign_in" | "sign_up";

// Only follow redirects back into this app.
function readNext() {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    // Also picks up the session from an email confirmation link.
    void supabase.auth.getSession().then(({ data }) => {
      setSignedInAs(data.session?.user.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedInAs(session?.user.email ?? null);
      if (event === "SIGNED_IN") router.replace(readNext());
    });

    return () => data.subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setError("Sign-in isn't available right now.");
      return;
    }

    setIsBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "sign_in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) {
          setError(
            signInError.message === "Email not confirmed"
              ? "Confirm your email first. Check your inbox for the link."
              : "That email and password don't match."
          );
        }
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(readNext())}`
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setNotice("Check your email and tap the link to finish signing up.");
        setMode("sign_in");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setSignedInAs(null);
  }

  const inputClass =
    "w-full border-[3px] border-[#000000] bg-white px-3 py-3 text-base font-bold text-black outline-none";

  if (signedInAs) {
    return (
      <main className="app-shell" style={{ backgroundColor: colors.base }}>
        <div className="mx-auto flex max-w-[500px] flex-col gap-6">
          <NeoWindow title="Account" variant="vegan" size="lg">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                Signed in.
              </h1>
              <p className="break-all text-sm font-bold uppercase tracking-[0.04em]">
                {signedInAs}
              </p>
              <NeoButton href="/" tone="base">
                Back to Scan
              </NeoButton>
              <NeoButton onClick={handleSignOut} tone="danger">
                Sign Out
              </NeoButton>
            </div>
          </NeoWindow>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow
          title={mode === "sign_in" ? "Sign In" : "Create Account"}
          variant="vegan"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {mode === "sign_in" ? "Welcome back." : "Join Vegan Eyes."}
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              Sign in to save your vegan recipes and scans.{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                How we use your data
              </Link>
            </p>

            <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.08em]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.08em]">
              Password
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "sign_in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>

            {error ? (
              <p
                className="border-[3px] border-[#000000] p-3 text-sm font-black uppercase tracking-[0.04em]"
                style={{ backgroundColor: colors.alert, color: colors.white }}
              >
                {error}
              </p>
            ) : null}

            {notice ? (
              <p
                className="border-[3px] border-[#000000] p-3 text-sm font-black uppercase tracking-[0.04em]"
                style={{ backgroundColor: colors.secondary, color: colors.black }}
              >
                {notice}
              </p>
            ) : null}

            <NeoButton type="submit" disabled={isBusy} tone="secondary">
              {isBusy
                ? "One moment..."
                : mode === "sign_in"
                  ? "Sign In"
                  : "Create Account"}
            </NeoButton>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "sign_in" ? "sign_up" : "sign_in");
                setError("");
              }}
              className="text-sm font-black uppercase underline tracking-[0.04em]"
            >
              {mode === "sign_in"
                ? "New here? Create an account"
                : "Have an account? Sign in"}
            </button>
          </form>
        </NeoWindow>
      </div>
    </main>
  );
}
