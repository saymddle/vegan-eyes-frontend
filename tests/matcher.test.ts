import { describe, expect, it } from "vitest";
import { withoutDishName } from "@/lib/ingredients/veganize";
import { checkIngredients, matchLine, normalize } from "@/lib/ingredients/matcher";
import { index, readRecipe } from "./helpers";

const names = (text: string) =>
  matchLine(normalize(text), index).map((match) => match.row.name);

describe("names made of several words", () => {
  it("keeps a known vegan name whole", () => {
    expect(names("1 box panko breadcrumbs")).toEqual(["Panko Breadcrumbs"]);
  });

  it("joins neighbouring non-vegan words into one item", () => {
    expect(names("1 chicken parmesan cutlet")).toEqual([
      "Chicken Parmesan Cutlet"
    ]);
  });

  it("gives the joined item one swap", () => {
    const [match] = matchLine(normalize("chicken parmesan cutlet"), index);
    expect(match.row.vegan_status).toBe("non_vegan");
    expect(match.row.swap_static).toBe("Vegan chicken parmesan cutlet");
  });

  it("prefers a database row over joining", () => {
    expect(names("brush with egg wash")).toEqual(["Egg Wash"]);
  });

  it("keeps separate items apart when other words sit between them", () => {
    expect(names("chicken and cheese")).toEqual(["Chicken", "Cheese"]);
  });
});

describe("cooking verbs are not ingredients", () => {
  it("skips 'bread the' and 'butter the'", () => {
    expect(names("Bread the first side")).toEqual([]);
    expect(names("Butter the pan")).toEqual([]);
  });

  it("still finds the noun", () => {
    expect(names("2 tbsp butter")).toEqual(["Butter"]);
  });
});

describe("a vegan marker covers the whole name", () => {
  it("skips every word after 'vegan'", () => {
    expect(names("1 vegan chicken parmesan")).toEqual([]);
  });
});

describe("the dish name is not an ingredient", () => {
  const recipe = readRecipe("13-chicken-parmesan.txt");
  const checked = checkIngredients(withoutDishName(recipe), index).map(
    (item) => item.name
  );

  it("leaves the recipe's title out of the check", () => {
    expect(checked).not.toContain("Chicken Parmesan Cutlet");
  });

  it("still flags the ingredients", () => {
    expect(checked).toContain("Chicken");
    expect(checked).toContain("Chicken Cutlet");
  });

  it("keeps the first line of a plain ingredient list", () => {
    expect(withoutDishName("chicken\nmilk")).toBe("chicken\nmilk");
  });
});
