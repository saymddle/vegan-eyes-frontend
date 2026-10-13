"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans } from "@/lib/api/getScans";
import { getRecipes } from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import type { SavedScan } from "@/lib/store/savedScans";
import { supabase } from "@/lib/supabase/client";
import { colors } from "@/lib/theme/colors";

const settingsItems = [
  "Edit Profile",
  "Preferences",
  "Saved Data",
  "About"
];

export default function ProfilePage() {
  const router = useRouter();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [recipeCount, setRecipeCount] = useState(0);
  const [email, setEmail] = useState<string | null>(null);
  const [activeSetting, setActiveSetting] = useState("Edit Profile");

  useEffect(() => {
    let isActive = true;

    async function loadProfileScans() {
      try {
        const [nextScans, recipes, user] = await Promise.all([
          getScans(),
          getRecipes(),
          supabase?.auth.getUser()
        ]);

        if (isActive) {
          setScans(nextScans);
          setRecipeCount(recipes.length);
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

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Profile" variant="vegan" size="lg">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border-[3px] border-[#000000] bg-[#DEE1E0]" />
            <div className="flex flex-col gap-2">
              <h1 className="break-all text-2xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                {email ? email.split("@")[0] : "Guest"}
              </h1>
              <p className="text-sm font-bold uppercase tracking-[0.08em]">
                Your account
              </p>
            </div>
          </div>
        </NeoWindow>

        <div className="grid grid-cols-2 gap-4">
          <NeoWindow title="Total Scans" variant="maybe" size="sm">
            <p className="text-4xl font-black uppercase">{scans.length}</p>
          </NeoWindow>
          <NeoWindow title="Saved Recipes" variant="maybe" size="sm">
            <p className="text-4xl font-black uppercase">{recipeCount}</p>
          </NeoWindow>
        </div>

        {settingsItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setActiveSetting(item)}
            className="cursor-pointer text-left transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <NeoWindow
              title={item}
              variant={activeSetting === item ? "vegan" : "maybe"}
              size="sm"
            >
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                {activeSetting === item ? "Selected" : "Open"}
              </p>
            </NeoWindow>
          </button>
        ))}

        <NeoButton onClick={handleSignOut} tone="danger" className="w-full">
          Sign Out
        </NeoButton>
      </div>
    </main>
  );
}
