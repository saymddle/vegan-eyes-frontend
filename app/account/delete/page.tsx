"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/components/ui/BackButton";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import {
  DELETE_PHRASE,
  deleteMyAccount,
  matchesDeletePhrase
} from "@/lib/api/deleteAccount";
import { authPath } from "@/lib/api/scansAuth";
import { supabase } from "@/lib/supabase/client";
import { colors } from "@/lib/theme/colors";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase?.auth.getUser().then(({ data }) => {
      if (!data.user) router.push(authPath());
    });
  }, [router]);

  const ready = matchesDeletePhrase(phrase);

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteMyAccount();
      router.replace("/goodbye");
    } catch {
      setError("We couldn't delete your account. Try again in a moment.");
      setIsDeleting(false);
    }
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <BackButton label="Profile" fallback="/profile" />
        <NeoWindow title="Delete account" variant="not_vegan" size="lg">
          <form onSubmit={handleDelete} className="flex flex-col gap-4">
            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em]">
              Leaving Vegan Eyes?
            </h1>
            <p className="text-sm font-bold leading-6">
              This deletes your account and everything saved with it: your
              recipes, scans, notes and profile. It can&apos;t be undone.
            </p>
            <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.08em]">
              Type “{DELETE_PHRASE}” to confirm
              <input
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={DELETE_PHRASE}
                className="min-h-[48px] border-[3px] border-[#000000] bg-white px-3 text-base font-bold normal-case tracking-normal text-black"
              />
            </label>
            {error ? (
              <p
                className="border-[3px] border-[#000000] p-3 text-sm font-black uppercase tracking-[0.04em]"
                style={{ backgroundColor: colors.white, color: colors.black }}
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <NeoButton
              type="submit"
              tone="danger"
              disabled={!ready || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete my account"}
            </NeoButton>
          </form>
        </NeoWindow>
      </div>
    </main>
  );
}
