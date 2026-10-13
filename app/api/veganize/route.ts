import { getIngredientIndex } from "@/lib/ingredients/loadIndex";
import { veganizeRecipe } from "@/lib/ingredients/veganize";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { recipe?: string };
    const recipe = body.recipe || "";

    if (!recipe.trim()) {
      return Response.json({ error: "No recipe text" }, { status: 400 });
    }

    const index = await getIngredientIndex();
    return Response.json(veganizeRecipe(recipe, index));
  } catch (error) {
    console.error("VEGANIZE FAILED:", error);
    return Response.json({ error: "Could not convert recipe" }, { status: 500 });
  }
}
