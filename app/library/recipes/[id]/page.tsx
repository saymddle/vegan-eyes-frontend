"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VeganRecipeView, {
  recipeStatusCopy,
  veganRecipeText
} from "@/components/features/VeganRecipeView";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import {
  deleteRecipe,
  getRecipeById,
  type SavedRecipe
} from "@/lib/api/recipes";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { colors } from "@/lib/theme/colors";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadRecipe() {
      try {
        const nextRecipe = await getRecipeById(params.id);

        if (isActive) {
          setSaved(nextRecipe);
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

    void loadRecipe();

    return () => {
      isActive = false;
    };
  }, [params.id, router]);

  async function handleCopy() {
    if (!saved) return;

    try {
      await navigator.clipboard.writeText(veganRecipeText(saved.recipe));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the text is still on screen to select.
    }
  }

  async function handleDelete() {
    try {
      await deleteRecipe(params.id);
    } catch (deleteError) {
      if (
        deleteError instanceof Error &&
        deleteError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
        return;
      }
    }

    router.push("/library/recipes");
  }

  const title = saved?.title ?? "Recipe Detail";
  const summary = saved ? recipeStatusCopy[saved.recipe.status] : null;

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "LIBRARY", path: "/library" },
            { label: "RECIPES", path: "/library/recipes" },
            { label: title }
          ]}
        />

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading recipe...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !saved ? (
          <NeoWindow title="Recipe not found" variant="maybe" size="md">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                This saved recipe no longer exists.
              </p>
              <NeoButton href="/library/recipes" tone="base">
                Back to Recipes
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading && saved && summary ? (
          <>
            <NeoWindow title={title} variant={summary.variant} size="lg">
              <div className="flex flex-col gap-4">
                <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                  {summary.title}
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.08em]">
                  Saved {new Date(saved.createdAt).toLocaleDateString()}
                </p>
              </div>
            </NeoWindow>

            <VeganRecipeView recipe={saved.recipe} />

            <div className="flex flex-col gap-3">
              <NeoButton
                onClick={handleCopy}
                tone={copied ? "secondary" : "primary"}
                className="w-full"
              >
                {copied ? "Copied" : "Copy Vegan Recipe"}
              </NeoButton>
              <NeoButton onClick={handleDelete} tone="danger" className="w-full">
                Delete
              </NeoButton>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
