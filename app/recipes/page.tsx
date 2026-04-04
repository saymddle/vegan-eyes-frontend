"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RecipeCard from "@/components/features/RecipeCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans } from "@/lib/api/getScans";
import { AUTH_REQUIRED_ERROR } from "@/lib/api/scansAuth";
import type { SavedScan } from "@/lib/store/savedScans";
import { colors } from "@/lib/theme/colors";

export default function RecipesPage() {
  const router = useRouter();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadRecipes() {
      try {
        const nextScans = await getScans();

        if (isActive) {
          setScans(nextScans);
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.message === AUTH_REQUIRED_ERROR
        ) {
          router.push("/auth");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      isActive = false;
    };
  }, [router]);

  const recipeScans = useMemo(
    () => scans.filter((scan) => scan.input.trim().length > 0),
    [scans]
  );

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Recipes" variant="vegan" size="lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Saved recipes.
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              Recipe-style scans collected from your saved ingredient checks.
            </p>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading recipes...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && recipeScans.length === 0 ? (
          <NeoWindow title="No saved scans yet" variant="maybe" size="sm">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                Save a scan result to build your recipe library.
              </p>
              <NeoButton href="/" tone="base">
                Run a Scan
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading
          ? recipeScans.map((scan) => <RecipeCard key={scan.id} scan={scan} />)
          : null}
      </div>
    </main>
  );
}
