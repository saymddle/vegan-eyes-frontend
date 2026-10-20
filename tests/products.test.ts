import { describe, expect, it } from "vitest";
import {
  isBarcode,
  splitTraces,
  productText,
  toProduct
} from "@/lib/products/openFoodFacts";
import { statusOf } from "./helpers";

// Shaped like Open Food Facts replies (trimmed to the fields we ask for).
const hazelnutSpread = {
  status: 1,
  product: {
    product_name: "Pâte à tartiner",
    product_name_en: "Hazelnut spread with cocoa",
    brands: "Nutella, Ferrero",
    ingredients_text_en:
      "Sugar, palm oil, hazelnuts 13%, skimmed milk powder 8.7%, fat-reduced cocoa 7.4%, emulsifier: lecithins (soya), vanillin",
    image_front_small_url:
      "https://images.openfoodfacts.org/x/front_en.200.jpg",
    labels_tags: ["en:no-gluten"]
  }
};

const oatDrink = {
  status: 1,
  product: {
    product_name: "Oat Drink",
    brands: "Oatly",
    ingredients_text:
      "Oat base (water, oats 10%), rapeseed oil, calcium carbonate, salt, vitamins (D2, riboflavin, B12)",
    labels_tags: ["en:vegan", "en:vegan-society-vegan-logo"]
  }
};

describe("barcode numbers", () => {
  it.each(["5000159484695", "012345678905", "96385074", "10012345678902"])(
    "accepts %s",
    (code) => expect(isBarcode(code)).toBe(true)
  );
  it.each(["", "123", "abc12345678", "50001594846951234", "1234567890"])(
    "rejects %s",
    (code) => expect(isBarcode(code)).toBe(false)
  );
});

describe("Open Food Facts replies", () => {
  it("reads a found product", () => {
    expect(toProduct("3017624010701", hazelnutSpread)).toEqual({
      barcode: "3017624010701",
      name: "Hazelnut spread with cocoa",
      brand: "Nutella",
      ingredients: hazelnutSpread.product.ingredients_text_en,
      traces: "",
      image: "https://images.openfoodfacts.org/x/front_en.200.jpg",
      labelledVegan: false
    });
  });

  it("falls back to the main-language fields and spots a vegan label", () => {
    const product = toProduct("7394376616501", oatDrink);
    expect(product?.name).toBe("Oat Drink");
    expect(product?.ingredients).toContain("Oat base");
    expect(product?.image).toBeNull();
    expect(product?.labelledVegan).toBe(true);
  });

  it("returns null when the barcode isn't known", () => {
    expect(toProduct("0000000000000", { status: 0 })).toBeNull();
  });
});

describe("product ingredients go through the same checker", () => {
  it("flags the milk in a hazelnut spread", () => {
    const text = productText(toProduct("3017624010701", hazelnutSpread)!);
    expect(text.split("\n")[0]).toBe("Nutella Hazelnut spread with cocoa");
    expect(statusOf(text)).toBe("non_vegan");
  });

  it("doesn't flag an oat drink", () => {
    const text = productText(toProduct("7394376616501", oatDrink)!);
    // "Vitamins" can be unclear (D3 is sometimes from wool), never non-vegan.
    expect(statusOf(text)).not.toBe("non_vegan");
  });
});

describe("may-contain warnings", () => {
  it.each([
    [
      "Wheat flour, sugar, cocoa butter. May contain traces of milk and egg.",
      "Wheat flour, sugar, cocoa butter",
      "May contain traces of milk and egg"
    ],
    [
      "Sugar, cocoa mass; may contain milk",
      "Sugar, cocoa mass",
      "may contain milk"
    ],
    [
      "Oats, salt. Made in a factory that also handles milk and eggs. Store dry.",
      "Oats, salt. Store dry.",
      "Made in a factory that also handles milk and eggs"
    ],
    ["Sugar, skimmed milk powder", "Sugar, skimmed milk powder", ""]
  ])("splits %j", (input, ingredients, traces) => {
    expect(splitTraces(input)).toEqual({ ingredients, traces });
  });

  it("doesn't flag a vegan chocolate for its may-contain warning", () => {
    const product = toProduct("1", {
      status: 1,
      product: {
        product_name: "Dark chocolate",
        ingredients_text: "Cocoa mass, sugar, cocoa butter. May contain milk."
      }
    })!;
    expect(product.traces).toBe("May contain milk");
    expect(statusOf(productText(product))).not.toBe("non_vegan");
  });
});
