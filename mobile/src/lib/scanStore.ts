import type { Product } from "@shared/products/openFoodFacts";
import { productText } from "@shared/products/openFoodFacts";

// What the Scan screen hands to Results. Kept in memory, like the
// website's session storage: a new scan replaces it.
export type RecipeSource = "paste" | "photo" | "url";

type Scan = {
  // The recipe the Vegan tab converts.
  recipe: string;
  // The text the verdict checks (only the ingredients for a product).
  check: string;
  source: RecipeSource;
  product: Product | null;
};

let current: Scan = { recipe: "", check: "", source: "paste", product: null };

export function storeScanInput(text: string, source: RecipeSource) {
  current = { recipe: text, check: text, source, product: null };
}

// A scanned barcode: only its ingredients are checked, since names like
// "Chicken flavour noodles" describe a taste, not what's inside.
export function storeProductScan(product: Product) {
  current = {
    recipe: productText(product),
    check: `Ingredients: ${product.ingredients}`,
    source: "photo",
    product
  };
}

export function readScan() {
  return current;
}
