import { describe, expect, it } from "vitest";
import { convert } from "./helpers";

// One ingredient line in, the vegan line out.
const veganLine = (line: string) => convert(line).lines[0].vegan;

describe("ingredient lines convert to sensible vegan lines", () => {
  const cases: [string, string][] = [
    // Stock and broth swap as a whole, not as "1 cup seitan".
    ["1 cup chicken stock", "1 cup vegetable broth"],
    ["2 cups beef broth", "2 cups vegetable broth"],
    ["2 cups beef stock and water", "2 cups vegetable broth and water"],
    // "&" reads as "and".
    ["1 cup half & half", "1 cup full-fat coconut cream"],
    // Cream descriptions go with the cream.
    ["1 cup heavy whipping cream", "1 cup full-fat coconut cream"],
    // Plant-based items already in the recipe stay as written.
    ["2 eggs or 2 flax eggs", "2 flax eggs (2 tbsp ground flaxseed + 6 tbsp water, rested 5 min) or 2 flax eggs"],
    ["1/2 cup cashew ricotta", "1/2 cup cashew ricotta"],
    ["1 cup vegan butter", "1 cup vegan butter"],
    // Accents in the recipe still match.
    ["1/2 cup crème fraîche", "1/2 cup vegan crème fraîche"]
  ];
  for (const [line, want] of cases) {
    it(line, () => expect(veganLine(line)).toBe(want));
  }

  it("keeps a plant-based phrase when the same word is swapped on another line", () => {
    const out = convert("1 cup butter\n1 cup vegan butter\n2 eggs\n1 flax egg");
    expect(out.lines.map((line) => line.vegan)).toEqual([
      "1 cup vegan butter",
      "1 cup vegan butter",
      "2 flax eggs (2 tbsp ground flaxseed + 6 tbsp water, rested 5 min)",
      "1 flax egg"
    ]);
  });

  it("finds pâté written with or without accents", () => {
    expect(convert("pâté").swaps.map((swap) => swap.ingredient)).toEqual(["Pate"]);
    expect(convert("pate").swaps.map((swap) => swap.ingredient)).toEqual(["Pate"]);
  });
});
