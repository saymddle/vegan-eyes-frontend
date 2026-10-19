"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VeganRecipeView, {
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
import { shareText } from "@/lib/utils/share";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

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
      flash("Copied");
    } catch {
      flash("Copy failed. Select the text and copy it instead.");
    }
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  async function handleShare() {
    if (!saved) return;
    const result = await shareText(saved.title, veganRecipeText(saved.recipe));
    if (result === "copied") flash("Copied to share");
    if (result === "failed") flash("Sharing isn't available here.");
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

        {!isLoading && saved ? (
          <>
            <VeganRecipeView
              recipe={{ ...saved.recipe, title: saved.title }}
              subtitle={`Saved ${new Date(saved.createdAt).toLocaleDateString()}`}
              actions={
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <NeoButton onClick={handleCopy} className="min-h-[44px] text-sm">
                      Copy
                    </NeoButton>
                    <NeoButton
                      onClick={handleShare}
                      tone="base"
                      className="min-h-[44px] text-sm"
                    >
                      Share
                    </NeoButton>
                    <NeoButton
                      onClick={() => window.print()}
                      tone="base"
                      className="min-h-[44px] text-sm"
                    >
                      Print
                    </NeoButton>
                  </div>
                  <p
                    className="min-h-5 text-center text-xs font-black uppercase"
                    aria-live="polite"
                  >
                    {notice}
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="min-h-[44px] self-center px-2 text-xs font-black uppercase tracking-[0.06em] underline underline-offset-4"
                    style={{ color: "#7a4137" }}
                  >
                    Delete recipe
                  </button>
                </div>
              }
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
