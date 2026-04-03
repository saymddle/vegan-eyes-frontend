"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import {
  deleteScan,
  deriveRecipeTitle,
  getScanById,
  type SavedScan
} from "@/lib/store/savedScans";
import { colors } from "@/lib/theme/colors";
import { highlightIngredients } from "@/lib/utils/highlightIngredients";

const statusLabel = {
  vegan: "VEGAN",
  not_vegan: "NOT VEGAN",
  maybe: "MAYBE"
};

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<SavedScan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRecipe(getScanById(params.id));
    setIsLoading(false);
  }, [params.id]);

  const title = useMemo(
    () => (recipe ? deriveRecipeTitle(recipe.input) : "Recipe Detail"),
    [recipe]
  );

  function handleDelete() {
    deleteScan(params.id);
    router.push("/library/recipes");
  }

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

        {!isLoading && !recipe ? (
          <NeoWindow title="Recipe not found" variant="maybe" size="md">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                This saved scan no longer exists.
              </p>
              <NeoButton href="/library/recipes" tone="base">
                Back to Recipes
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading && recipe ? (
          <>
            <NeoWindow title={title} variant={recipe.result.status} size="lg">
              <div className="flex flex-col gap-4">
                <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                  {statusLabel[recipe.result.status]}
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.08em]">
                  {new Date(recipe.timestamp).toLocaleDateString()}
                </p>
              </div>
            </NeoWindow>

            <NeoWindow
              title="Highlighted Ingredients"
              variant={recipe.result.status}
              size="md"
            >
              <div
                className="border-[3px] border-[#000000] bg-[#DEE1E0] p-4 text-sm font-bold uppercase leading-7 tracking-[0.04em]"
                dangerouslySetInnerHTML={{
                  __html: highlightIngredients(
                    recipe.input,
                    recipe.result.ingredients
                  )
                }}
              />
            </NeoWindow>

            {recipe.result.ingredients.length === 0 ? (
              <NeoWindow title="Ingredients" variant="vegan" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  No flagged ingredients saved for this recipe.
                </p>
              </NeoWindow>
            ) : (
              recipe.result.ingredients.map((ingredient) => (
                <NeoWindow
                  key={ingredient.name}
                  title={ingredient.name}
                  variant={ingredient.status}
                  size="sm"
                >
                  <div className="flex flex-col gap-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
                    <p>
                      {ingredient.reason ||
                        "No nutrition detail returned for this ingredient."}
                    </p>
                    <p className="font-black">
                      Substitutes: {ingredient.swap || "No substitute listed"}
                    </p>
                    <p>
                      Complexity:{" "}
                      {ingredient.isComplex
                        ? "Complex ingredient. Supplier origin may vary."
                        : "Simple ingredient profile."}
                    </p>
                  </div>
                </NeoWindow>
              ))
            )}

            <NeoButton onClick={handleDelete} tone="danger" className="w-full">
              Delete
            </NeoButton>
          </>
        ) : null}
      </div>
    </main>
  );
}
