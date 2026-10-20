import { checkIngredients } from "@/lib/ingredients/matcher";
import { getIngredientIndex } from "@/lib/ingredients/loadIndex";
import { withoutDishName } from "@/lib/ingredients/veganize";
import type { CheckResponse } from "@/lib/types/check";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ingredients?: string };
    const ingredients = body.ingredients || "";

    if (!ingredients.trim()) {
      const emptyResponse: CheckResponse = {
        status: "error",
        flagged: []
      };

      return Response.json(emptyResponse, { status: 400 });
    }

    const index = await getIngredientIndex();
    const flagged = checkIngredients(withoutDishName(ingredients), index);

    const response: CheckResponse = {
      status: flagged.some((item) => item.vegan_status === "non_vegan")
        ? "non_vegan"
        : flagged.length > 0
          ? "unclear"
          : "vegan",
      flagged
    };

    return Response.json(response);
  } catch (error) {
    console.error("CHECK FAILED:", error);

    const errorResponse: CheckResponse = {
      status: "error",
      flagged: []
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
