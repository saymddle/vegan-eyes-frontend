"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans } from "@/lib/api/getScans";
import { getProfile, saveProfile } from "@/lib/api/profile";
import { getRecipes, type SavedRecipe } from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import type { SavedScan } from "@/lib/store/savedScans";
import { supabase } from "@/lib/supabase/client";
import { colors } from "@/lib/theme/colors";

// The ingredients swapped most often across saved recipes.
function topSwaps(recipes: SavedRecipe[]) {
  const counts = new Map<string, number>();
  recipes.forEach(({ recipe }) =>
    recipe.swaps
      .filter((swap) => swap.replacement)
      .forEach((swap) => {
        const name = swap.ingredient.toLowerCase();
        counts.set(name, (counts.get(name) ?? 0) + 1);
      })
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

const inputClass =
  "w-full border-[3px] border-[#000000] bg-white px-3 py-3 text-base font-bold text-black outline-none";

export default function ProfilePage() {
  const router = useRouter();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadProfileScans() {
      try {
        const [nextScans, nextRecipes, profile, user] = await Promise.all([
          getScans(),
          getRecipes(),
          getProfile(),
          supabase?.auth.getUser()
        ]);

        if (isActive) {
          setScans(nextScans);
          setRecipes(nextRecipes);
          setDisplayName(profile.displayName);
          setBio(profile.bio);
          setEmail(user?.data.user?.email ?? null);
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.message === AUTH_REQUIRED_ERROR
        ) {
          router.push(authPath());
        }
      }
    }

    void loadProfileScans();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      await saveProfile({ displayName, bio });
      setIsEditing(false);
    } catch {
      setSaveError("Could not save your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  const mostSwapped = topSwaps(recipes);
  const swapCount = recipes.reduce(
    (total, { recipe }) =>
      total + recipe.swaps.filter((swap) => swap.replacement).length,
    0
  );

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow variant="vegan" size="lg">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border-[3px] border-[#000000] bg-[#DEE1E0]" />
            <div className="flex flex-col gap-2">
              <h1 className="break-all text-2xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                {displayName || (email ? email.split("@")[0] : "Guest")}
              </h1>
              <p className="break-all text-sm font-bold uppercase tracking-[0.08em]">
                {email ?? "Your account"}
              </p>
            </div>
          </div>
          {bio ? (
            <p className="mt-4 text-sm font-bold leading-6">{bio}</p>
          ) : null}
        </NeoWindow>

        <div className="grid grid-cols-3 gap-2 min-[400px]:gap-3">
          <NeoWindow
            title="Scans"
            variant="maybe"
            size="sm"
            className="min-w-0 [&_.neo-head]:px-1.5 [&_.neo-head]:text-[10px] [&_.neo-head]:tracking-normal min-[400px]:[&_.neo-head]:px-2.5 min-[400px]:[&_.neo-head]:text-base"
          >
            <p className="text-4xl font-black uppercase">{scans.length}</p>
          </NeoWindow>
          <NeoWindow
            title="Recipes"
            variant="maybe"
            size="sm"
            className="min-w-0 [&_.neo-head]:px-1.5 [&_.neo-head]:text-[10px] [&_.neo-head]:tracking-normal min-[400px]:[&_.neo-head]:px-2.5 min-[400px]:[&_.neo-head]:text-base"
          >
            <p className="text-4xl font-black uppercase">{recipes.length}</p>
          </NeoWindow>
          <NeoWindow
            title="Swaps"
            variant="maybe"
            size="sm"
            className="min-w-0 [&_.neo-head]:px-1.5 [&_.neo-head]:text-[10px] [&_.neo-head]:tracking-normal min-[400px]:[&_.neo-head]:px-2.5 min-[400px]:[&_.neo-head]:text-base"
          >
            <p className="text-4xl font-black uppercase">{swapCount}</p>
          </NeoWindow>
        </div>

        <NeoWindow title="Most Swapped" variant="vegan" size="md">
          {mostSwapped.length ? (
            <ol className="flex flex-col gap-2">
              {mostSwapped.map(([name, count]) => (
                <li
                  key={name}
                  className="flex justify-between text-sm font-black uppercase tracking-[0.04em]"
                >
                  <span>{name}</span>
                  <span>{count}x</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm font-bold uppercase tracking-[0.04em]">
              Save a converted recipe to see what you swap most.
            </p>
          )}
        </NeoWindow>

        <NeoWindow title="Edit Profile" variant="maybe" size="md">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.08em]">
                Display name
                <input
                  value={displayName}
                  maxLength={40}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.08em]">
                Bio
                <textarea
                  value={bio}
                  maxLength={200}
                  rows={3}
                  onChange={(event) => setBio(event.target.value)}
                  className={inputClass}
                />
              </label>
              {saveError ? (
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  {saveError}
                </p>
              ) : null}
              <NeoButton type="submit" disabled={isSaving} tone="secondary">
                {isSaving ? "Saving..." : "Save Profile"}
              </NeoButton>
            </form>
          ) : (
            <NeoButton onClick={() => setIsEditing(true)} tone="base" className="w-full">
              Edit Name and Bio
            </NeoButton>
          )}
        </NeoWindow>

        <NeoButton href="/library" tone="base" className="w-full">
          Your Library
        </NeoButton>

        <NeoButton onClick={handleSignOut} tone="danger" className="w-full">
          Sign Out
        </NeoButton>

        <Link
          href="/account/delete"
          className="inline-flex min-h-[44px] items-center self-center px-2 text-xs font-black uppercase tracking-[0.06em] underline underline-offset-4"
          style={{ color: "#7a4137" }}
        >
          Delete account
        </Link>

        <Link
          href="/privacy"
          className="inline-flex min-h-[44px] items-center self-center px-2 text-xs font-black uppercase tracking-[0.06em] underline underline-offset-4"
        >
          Privacy
        </Link>
      </div>
    </main>
  );
}
