import NeoWindow from "@/components/ui/NeoWindow";
import NeoButton from "@/components/ui/NeoButton";
import type { SavedRecipe } from "@/lib/api/recipes";

type Props = {
  recipe: SavedRecipe;
};

export default function RecipeCard({ recipe }: Props) {
  const swapped = recipe.recipe.swaps.filter((swap) => swap.replacement);

  return (
    <NeoWindow title={recipe.title} variant="vegan" size="sm">
      <div className="flex flex-col gap-3">
        <p className="line-clamp-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
          {swapped.length
            ? swapped.map((swap) => `${swap.ingredient} → ${swap.replacement}`).join(" · ")
            : "Already vegan"}
        </p>
        <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.12em]">
          <p>{new Date(recipe.createdAt).toLocaleDateString()}</p>
          <p>
            {swapped.length} {swapped.length === 1 ? "swap" : "swaps"}
          </p>
        </div>
        <NeoButton href={`/library/recipes/${recipe.id}`} tone="base">
          Open Recipe
        </NeoButton>
      </div>
    </NeoWindow>
  );
}
