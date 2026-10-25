import { describe, expect, it } from "vitest";
import { highlightIngredients } from "@/lib/utils/highlightIngredients";

describe("original recipe highlighting", () => {
  it("highlights a long name once, not the short name inside it", () => {
    const html = highlightIngredients("1 chicken parmesan cutlet and chicken", [
      { name: "Chicken", status: "not_vegan" },
      { name: "Chicken Parmesan Cutlet", status: "not_vegan" }
    ]);
    expect(html.match(/<span/g)).toHaveLength(2);
    expect(html).toContain('data-ingredient="Chicken Parmesan Cutlet"');
    expect(html).toContain(">chicken parmesan cutlet</span>");
    expect(html).toContain(">chicken</span>");
  });

  it("ignores accents", () => {
    const html = highlightIngredients("1 cup crème fraîche and pâté", [
      { name: "Creme Fraiche", status: "not_vegan" },
      { name: "Pate", status: "not_vegan" }
    ]);
    expect(html).toContain('data-ingredient="Creme Fraiche"');
    expect(html).toContain(">crème fraîche</span>");
    expect(html).toContain(">pâté</span>");
  });

  it("escapes the recipe text", () => {
    expect(highlightIngredients("<b>milk</b>", [])).toBe(
      "&lt;b&gt;milk&lt;/b&gt;"
    );
  });
});
