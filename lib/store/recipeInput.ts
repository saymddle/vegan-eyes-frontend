// The text the Scan screen hands to the result screens.
export const RECIPE_STORAGE_KEY = "vegan-eyes:last-recipe";
export const RECIPE_SOURCE_KEY = "vegan-eyes:last-recipe-source";
export const INPUT_STORAGE_KEY = "vegan-eyes:last-scan";

export type RecipeSource = "paste" | "photo" | "url";

export function storeScanInput(text: string, source: RecipeSource) {
  sessionStorage.setItem(RECIPE_STORAGE_KEY, text);
  sessionStorage.setItem(RECIPE_SOURCE_KEY, source);
  sessionStorage.setItem(INPUT_STORAGE_KEY, text);
}

export function readRecipeSource(): RecipeSource {
  const source = sessionStorage.getItem(RECIPE_SOURCE_KEY);
  return source === "photo" || source === "url" ? source : "paste";
}
