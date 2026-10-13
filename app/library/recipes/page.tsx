"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RecipeCard from "@/components/features/RecipeCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getRecipes, type SavedRecipe } from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { colors } from "@/lib/theme/colors";

export default function LibraryRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadRecipes() {
      try {
        const nextRecipes = await getRecipes();

        if (isActive) {
          setRecipes(nextRecipes);
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.message === AUTH_REQUIRED_ERROR
        ) {
          router.push(authPath());
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

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "LIBRARY", path: "/library" },
            { label: "RECIPES" }
          ]}
        />

        <NeoWindow title="Recipes" variant="vegan" size="lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Saved recipes.
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              Vegan versions of the recipes you have scanned and saved.
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

        {!isLoading && recipes.length === 0 ? (
          <NeoWindow title="No saved recipes yet" variant="maybe" size="sm">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                Scan a recipe, then tap Save Recipe to keep its vegan version here.
              </p>
              <NeoButton href="/" tone="base">
                Run a Scan
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading
          ? recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          : null}
      </div>
    </main>
  );
}
