// Looks up packaged products by barcode in Open Food Facts, a free public
// food database (https://world.openfoodfacts.org). Its data is shared under
// the Open Database License, so the app credits it wherever it is shown.

export type Product = {
  barcode: string;
  name: string;
  brand: string;
  ingredients: string;
  // Allergen warnings like "May contain milk", kept apart from the
  // ingredients: they're about shared factories, not what's in the food.
  traces: string;
  image: string | null;
  // The pack carries a vegan label (e.g. the Vegan Society trademark).
  labelledVegan: boolean;
};

export const OFF_FIELDS = [
  "product_name",
  "product_name_en",
  "brands",
  "ingredients_text",
  "ingredients_text_en",
  "image_front_small_url",
  "labels_tags"
].join(",");

// EAN-8, UPC-A (12), EAN-13 and GTIN-14.
export function isBarcode(value: string) {
  return /^\d{8}$|^\d{12,14}$/.test(value);
}

type OffResponse = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    image_front_small_url?: string;
    labels_tags?: string[];
  };
};

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const TRACE_WARNING =
  /(?:^|[.;]\s*|\s)((?:may (?:also )?contain|may be present|(?:made|produced|manufactured|packed) (?:in|on) (?:a )?(?:factory|site|facility|line|equipment))\b[^.;]*)[.;]?/gi;

// Marks where a warning was cut out, so the text around it can be rejoined.
const GAP = "\x00";

// Splits "may contain" warnings off the ingredient list.
export function splitTraces(ingredients: string) {
  const traces: string[] = [];
  const rest = ingredients.replace(TRACE_WARNING, (_match, warning: string) => {
    traces.push(warning.trim());
    return GAP;
  });
  if (!traces.length) return { ingredients, traces: "" };
  return {
    ingredients: rest
      .replace(/^[\s\x00]+|[\s\x00]+$/g, "")
      .replace(/[.\s]*\x00[\s\x00]*/g, ". "),
    traces: traces.join(". ")
  };
}

// Turns an Open Food Facts reply into a Product, or null if not found.
export function toProduct(barcode: string, data: OffResponse): Product | null {
  const p = data.product;
  if (data.status !== 1 || !p) return null;

  const image = text(p.image_front_small_url);
  const { ingredients, traces } = splitTraces(
    text(p.ingredients_text_en) || text(p.ingredients_text)
  );
  return {
    barcode,
    name: text(p.product_name_en) || text(p.product_name),
    // "Brand A, Brand B" lists the owner too; the first is the one on the pack.
    brand: text(p.brands).split(",")[0].trim(),
    ingredients,
    traces,
    image: image.startsWith("https://") ? image : null,
    labelledVegan: (p.labels_tags ?? []).includes("en:vegan")
  };
}

// What the results page checks: a title line, then the ingredient list.
export function productText(product: Product) {
  const title =
    [product.brand, product.name].filter(Boolean).join(" ") || "Product";
  return `${title}\nIngredients: ${product.ingredients}`;
}
