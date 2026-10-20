import { type Product, productText } from "@/lib/products/openFoodFacts";

// The text the Scan screen hands to the result screens.
export const RECIPE_STORAGE_KEY = "vegan-eyes:last-recipe";
export const RECIPE_SOURCE_KEY = "vegan-eyes:last-recipe-source";
export const INPUT_STORAGE_KEY = "vegan-eyes:last-scan";
export const PRODUCT_STORAGE_KEY = "vegan-eyes:last-product";

export type RecipeSource = "paste" | "photo" | "url";

export function storeScanInput(text: string, source: RecipeSource) {
  sessionStorage.setItem(RECIPE_STORAGE_KEY, text);
  sessionStorage.setItem(RECIPE_SOURCE_KEY, source);
  sessionStorage.setItem(INPUT_STORAGE_KEY, text);
  sessionStorage.removeItem(PRODUCT_STORAGE_KEY);
}

// A scanned barcode: its ingredients are checked like any other scan, and
// the product card is shown above the verdict.
export function storeProductScan(product: Product) {
  storeScanInput(productText(product), "photo");
  // Only the ingredients are checked: names like "Chicken flavour noodles"
  // describe a taste, not what's inside.
  sessionStorage.setItem(
    INPUT_STORAGE_KEY,
    `Ingredients: ${product.ingredients}`
  );
  sessionStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(product));
}

export function readProduct(): Product | null {
  try {
    const stored = sessionStorage.getItem(PRODUCT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Product) : null;
  } catch {
    return null;
  }
}

export function readRecipeSource(): RecipeSource {
  const source = sessionStorage.getItem(RECIPE_SOURCE_KEY);
  return source === "photo" || source === "url" ? source : "paste";
}
