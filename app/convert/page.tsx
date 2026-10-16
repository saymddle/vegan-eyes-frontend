"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import VeganRecipeView, {
  veganRecipeText,
  veganRecipeTitle
} from "@/components/features/VeganRecipeView";
import BackButton from "@/components/ui/BackButton";
import NeoButton from "@/components/ui/NeoButton";
import { saveRecipe } from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import {
  applySwapChoices,
  type SwapChoice,
  type SwapChoices
} from "@/lib/ingredients/swapChoices";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import { RECIPE_STORAGE_KEY, readRecipeSource } from "@/lib/store/recipeInput";
import { colors } from "@/lib/theme/colors";
import { shareText } from "@/lib/utils/share";

export default function ConvertPage() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [converted, setConverted] = useState<VeganizedRecipe | null>(null);
  const [choices, setChoices] = useState<SwapChoices>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // What is shown, copied and saved: the conversion with the cook's picks.
  const recipe = useMemo(
    () => (converted ? applySwapChoices(converted, choices) : null),
    [converted, choices]
  );

  const convert = useCallback(async (isActive: () => boolean) => {
    const stored = sessionStorage.getItem(RECIPE_STORAGE_KEY) || "";
    setSource(stored);
    setError("");

    if (!stored.trim()) {
      setError("There's no recipe to convert yet. Scan or paste one to start.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/veganize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: stored })
      });

      if (!res.ok) {
        throw new Error(
          "We couldn't convert this recipe. Check your connection and try again."
        );
      }

      const data = (await res.json()) as VeganizedRecipe;
      if (isActive()) {
        setConverted(data);
        setChoices({});
      }
    } catch (requestError) {
      if (isActive()) {
        setError(
          requestError instanceof Error &&
            requestError.message.startsWith("We couldn't")
            ? requestError.message
            : "We couldn't convert this recipe. Check your connection and try again."
        );
      }
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void convert(() => active);
    return () => {
      active = false;
    };
  }, [convert]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  function handleChoose(swap: number, choice: SwapChoice | undefined) {
    setChoices((current) => {
      const next = { ...current };
      if (choice) next[swap] = choice;
      else delete next[swap];
      return next;
    });
    // A changed recipe is a different recipe from the one saved.
    setSavedId(null);
  }

  async function handleCopy() {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(veganRecipeText(recipe));
      flash("Copied");
    } catch {
      flash("Copy failed. Select the text and copy it instead.");
    }
  }

  async function handleShare() {
    if (!recipe) return;
    const result = await shareText(
      veganRecipeTitle(recipe),
      veganRecipeText(recipe)
    );
    if (result === "copied") flash("Copied to share");
    if (result === "failed") flash("Sharing isn't available here.");
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
      flash("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <BackButton label="Scan" />
        {isLoading ? (
          <section
            className="border-[3px] border-[#000000] p-4 shadow-[8px_8px_0px_#000000]"
            style={{ backgroundColor: colors.white }}
            aria-busy="true"
          >
            <p className="text-lg font-black uppercase tracking-[0.02em]">
              Converting your recipe...
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.04em]">
              Finding animal ingredients and their plant-based swaps.
            </p>
            <div className="mt-4 flex animate-pulse flex-col gap-2">
              {[80, 65, 90, 50].map((width) => (
                <div
                  key={width}
                  className="h-3"
                  style={{ width: `${width}%`, backgroundColor: colors.base }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && error ? (
          <section
            className="border-[3px] border-[#000000] p-4 shadow-[8px_8px_0px_#000000]"
            style={{ backgroundColor: colors.white }}
            role="alert"
          >
            <p className="text-lg font-black uppercase tracking-[0.02em]">
              {source ? "Something went wrong" : "No recipe yet"}
            </p>
            <p className="mt-1 text-sm font-bold">{error}</p>
            <div className="mt-4 flex flex-col gap-3">
              {source ? (
                <NeoButton
                  onClick={() => void convert(() => true)}
                  className="w-full"
                >
                  Try Again
                </NeoButton>
              ) : null}
              <NeoButton
                href="/"
                tone={source ? "base" : "primary"}
                className="w-full"
              >
                Scan a Recipe
              </NeoButton>
            </div>
          </section>
        ) : null}

        {!isLoading && recipe ? (
          <VeganRecipeView
            recipe={recipe}
            choices={choices}
            onChoose={handleChoose}
            actions={
              <div className="flex flex-col gap-3">
                {savedId ? (
                  <NeoButton
                    href={`/library/recipes/${savedId}`}
                    tone="secondary"
                    className="w-full py-3 text-lg"
                  >
                    Saved. Open in Library
                  </NeoButton>
                ) : (
                  <NeoButton
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-3 text-lg"
                  >
                    {isSaving ? "Saving..." : "Save Recipe"}
                  </NeoButton>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <NeoButton
                    onClick={handleCopy}
                    tone="base"
                    className="text-xs"
                  >
                    Copy
                  </NeoButton>
                  <NeoButton
                    onClick={handleShare}
                    tone="base"
                    className="text-xs"
                  >
                    Share
                  </NeoButton>
                </div>
                <p
                  className="min-h-5 text-center text-xs font-black uppercase"
                  aria-live="polite"
                >
                  {notice}
                </p>
                <div className="flex justify-center gap-6 text-xs font-black uppercase tracking-[0.06em]">
                  <Link href="/" className="underline underline-offset-4">
                    Scan another
                  </Link>
                  <Link
                    href="/results"
                    className="underline underline-offset-4"
                  >
                    Ingredient details
                  </Link>
                </div>
              </div>
            }
          />
        ) : null}
      </div>
    </main>
  );
}
