"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VeganRecipeView, {
  recipeStatusCopy,
  veganRecipeText,
  veganRecipeTitle
} from "@/components/features/VeganRecipeView";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { saveRecipe } from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import {
  RECIPE_STORAGE_KEY,
  readRecipeSource
} from "@/lib/store/recipeInput";
import { colors } from "@/lib/theme/colors";

export default function ConvertPage() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [recipe, setRecipe] = useState<VeganizedRecipe | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function convert() {
      const stored = sessionStorage.getItem(RECIPE_STORAGE_KEY) || "";
      setSource(stored);

      if (!stored.trim()) {
        setError("No recipe found. Go back and scan or paste one.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/veganize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: stored })
        });

        if (!res.ok) {
          throw new Error("Could not convert this recipe right now.");
        }

        const data = (await res.json()) as VeganizedRecipe;
        if (isActive) setRecipe(data);
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not convert this recipe right now."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void convert();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleCopy() {
    if (!recipe) return;

    try {
      await navigator.clipboard.writeText(veganRecipeText(recipe));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the text and copy it instead.");
    }
  }

  async function handleSave() {
    if (!recipe || savedId) return;
    setIsSaving(true);

    try {
      const saved = await saveRecipe(
        veganRecipeTitle(recipe),
        readRecipeSource(),
        source,
        recipe
      );
      setSavedId(saved.id);
    } catch (saveError) {
      if (
        saveError instanceof Error &&
        saveError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
        return;
      }
      setError("Could not save this recipe. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const summary = recipe ? recipeStatusCopy[recipe.status] : null;

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow
          title={recipe ? veganRecipeTitle(recipe) : "Recipe"}
          variant={error ? "not_vegan" : summary?.variant ?? "maybe"}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {error ? "Error" : summary?.title ?? "Converting"}
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              {error ||
                summary?.body ||
                "Swapping animal ingredients for plant-based ones."}
            </p>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Converting recipe...
            </p>
          </NeoWindow>
        ) : null}

        {recipe ? <VeganRecipeView recipe={recipe} /> : null}

        <div className="flex flex-col gap-3">
          {savedId ? (
            <NeoButton
              href={`/library/recipes/${savedId}`}
              tone="secondary"
              className="w-full"
            >
              Saved. Open in Library
            </NeoButton>
          ) : (
            <NeoButton
              onClick={handleSave}
              disabled={!recipe || isSaving}
              tone="primary"
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Recipe"}
            </NeoButton>
          )}
          <NeoButton
            onClick={handleCopy}
            disabled={!recipe}
            tone={copied ? "secondary" : "base"}
            className="w-full"
          >
            {copied ? "Copied" : "Copy Vegan Recipe"}
          </NeoButton>
          <NeoButton href="/" tone="base" className="w-full">
            Scan Another
          </NeoButton>
          {source ? (
            <NeoButton href="/results" tone="base" className="w-full">
              Ingredient Details
            </NeoButton>
          ) : null}
        </div>
      </div>
    </main>
  );
}
