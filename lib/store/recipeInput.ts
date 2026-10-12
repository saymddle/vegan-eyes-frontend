// The text the Scan screen hands to the result screens.
export const RECIPE_STORAGE_KEY = "vegan-eyes:last-recipe";
export const INPUT_STORAGE_KEY = "vegan-eyes:last-scan";

export function storeScanInput(text: string) {
  sessionStorage.setItem(RECIPE_STORAGE_KEY, text);
  sessionStorage.setItem(INPUT_STORAGE_KEY, text);
}
