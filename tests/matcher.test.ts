import { describe, expect, it } from "vitest";
import { matchLine, normalize } from "@/lib/ingredients/matcher";
import { index } from "./helpers";

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
