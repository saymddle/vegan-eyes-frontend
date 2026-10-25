import { checkIngredients } from "@shared/ingredients/matcher";
import { withoutDishName } from "@shared/ingredients/veganize";
import type { UIResult, UIStatus } from "@shared/types/result";
import { getIndex } from "./ingredientIndex";

// The verdict, worked out on the phone (the website asked its server).
export function runCheck(text: string): UIResult {
  const flagged = checkIngredients(withoutDishName(text), getIndex());
  const status: UIStatus = flagged.some((item) => item.vegan_status === "non_vegan")
    ? "not_vegan"
    : flagged.length > 0
      ? "maybe"
      : "vegan";
  return {
    status,
    ingredients: flagged.map((item) => ({
      name: item.name,
      status: item.vegan_status === "non_vegan" ? "not_vegan" : "maybe",
      reason: item.nourishment_fact,
      swap: item.swap_static || item.swap_functional,
      isComplex: item.is_complex
    }))
  };
}
