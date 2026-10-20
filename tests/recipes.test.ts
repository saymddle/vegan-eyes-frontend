import { describe, expect, it } from "vitest";
import { applySwapChoices } from "@/lib/ingredients/swapChoices";
import { convert, readRecipe } from "./helpers";

type Case = {
  file: string;
  status: "vegan" | "unclear" | "non_vegan";
  // Ingredients listed under "Your substitutions", in any order.
  swapped: string[];
  // Text the vegan version must have, and must no longer have.
  has?: string[];
  lacks?: string[];
};

const cases: Case[] = [
  {
    file: "01-pancakes.txt",
    status: "non_vegan",
    swapped: ["Sugar", "Milk", "Egg", "Butter", "Honey"],
    has: [
      "1 cup unsweetened oat milk",
      "1 flax egg (1 tbsp ground flaxseed + 3 tbsp water",
      "2 tbsp melted vegan butter",
      "Maple syrup, to serve"
    ],
    lacks: ["1 cup milk", "1 egg", "melted butter", "Honey"]
  },
  {
    file: "02-website-cookies.txt",
    status: "non_vegan",
    swapped: ["Butter", "Brown Sugar", "Granulated Sugar", "Egg", "Chocolate"],
    has: [
      "1 cup unsalted vegan butter, softened",
      "2 flax eggs (2 tbsp ground flaxseed + 6 tbsp water",
      "Cream the vegan butter and sugars",
      "Beat in the flax eggs one at a time"
    ],
    // Website buttons are dropped, and checkboxes are stripped.
    lacks: ["Prevent your screen", "Print Recipe", "▢", "2 large eggs"]
  },
  {
    file: "03-one-line.txt",
    status: "non_vegan",
    swapped: ["Egg", "Milk", "Butter", "Cheddar", "Bacon"],
    has: [
      "whisk 3 flax eggs",
      "2 tbsp unsweetened oat milk",
      "1 tbsp vegan butter",
      "crumbled tempeh bacon"
    ],
    // "cheddar cheese" is one swap, not "vegan cheddar vegan cheese".
    lacks: ["3 eggs", "2 tbsp milk", "crumbled bacon", "vegan cheese"]
  },
  {
    file: "04-already-vegan.txt",
    status: "vegan",
    swapped: []
  },
  {
    file: "05-vegan-markers.txt",
    status: "unclear",
    // Only the pasta needs a label check; the marked items stay as written.
    swapped: ["Pasta"],
    has: [
      "2 tbsp vegan butter",
      "2 cups plant-based milk",
      "1 cup dairy-free cheddar"
    ]
  },
  {
    file: "06-ocr-markdown.txt",
    status: "non_vegan",
    swapped: ["Chicken", "Heavy Cream", "Parmesan", "Butter", "Fettuccine"],
    has: [
      "2 seitan cutlets",
      "1 cup full-fat coconut cream",
      "cook the seitan until golden",
      "add the full-fat coconut cream"
    ],
    lacks: ["chicken breasts", "cook the chicken", "1 cup heavy cream"]
  },
  {
    file: "07-lasagna.txt",
    status: "non_vegan",
    swapped: [
      "Beef",
      "Cotechino",
      "Ricotta",
      "Egg",
      "Mozzarella",
      "Parmesan",
      // "lasagna noodles" is one item, not two.
      "Lasagna Noodles"
    ],
    has: [
      "1 lb plant-based mince",
      "15 oz tofu ricotta",
      "2 cups vegan mozzarella",
      "1/2 cup vegan parmesan"
    ],
    lacks: ["ground beef", "vegan cheese"]
  },
  {
    file: "08-panna-cotta.txt",
    status: "non_vegan",
    swapped: ["Heavy Cream", "Milk", "Honey", "Gelatin"],
    has: ["1 packet agar agar", "1/4 cup maple syrup"],
    lacks: ["packet gelatin", "1/4 cup honey"]
  },
  {
    file: "09-accents.txt",
    status: "non_vegan",
    swapped: ["Crème Fraîche"],
    has: ["1/2 cup vegan crème fraîche"]
  },
  {
    // Words that look non-vegan but are not.
    file: "10-false-friends.txt",
    status: "vegan",
    swapped: []
  },
  {
    file: "11-several-per-line.txt",
    status: "non_vegan",
    swapped: ["Egg", "Cheese", "Bacon", "Sour Cream"],
    has: [
      "6 flax eggs",
      "1 cup vegan cheese",
      "4 slices tempeh bacon",
      "1/2 cup vegan sour cream"
    ],
    lacks: ["6 eggs", "shredded cheese", "slices bacon"]
  },
  {
    file: "12-fish-tacos.txt",
    status: "non_vegan",
    swapped: ["Cod", "Mayonnaise", "Worcestershire Sauce"],
    has: ["1/2 cup vegan mayonnaise", "1 tbsp vegan Worcestershire sauce"],
    lacks: ["cod"]
  },
  {
    // Names made of several words are one item: "panko breadcrumbs" is
    // vegan, "chicken parmesan cutlet" is one non-vegan dish.
    file: "13-chicken-parmesan.txt",
    status: "non_vegan",
    swapped: [
      "Chicken",
      "Turkey",
      "Egg",
      "Pizza Sauce",
      "Mozzarella",
      "Meat",
      "Chicken Cutlet",
      "Egg Wash",
      "Cutlet",
      "Chicken Parmesan",
      "Cheese"
    ],
    has: [
      // The title is the finished dish; chicken cutlet is the ingredient.
      "Vegan Chicken Parmesan Cutlet",
      "like a pounded seitan cutlet",
      "1 full box panko breadcrumbs",
      "Brush the surface with plant milk wash.",
      "Bread the First Side"
    ],
    lacks: [
      "panko vegan breadcrumbs",
      "vegan pizza vegan sauce",
      "flax eggs wash",
      "vegan chicken vegan parmesan"
    ]
  }
];

const veganText = (file: string) =>
  convert(readRecipe(file))
    .lines.map((line) => line.vegan)
    .join("\n");

describe("recipes convert to vegan", () => {
  for (const c of cases) {
    describe(c.file, () => {
      const result = convert(readRecipe(c.file));
      const text = result.lines.map((line) => line.vegan).join("\n");

      it("has the right verdict", () => {
        expect(result.status).toBe(c.status);
      });

      it("lists the right substitutions", () => {
        expect(result.swaps.map((swap) => swap.ingredient).sort()).toEqual(
          [...c.swapped].sort()
        );
      });

      for (const want of c.has ?? []) {
        it(`has "${want}"`, () => expect(text).toContain(want));
      }
      for (const gone of c.lacks ?? []) {
        it(`no longer has "${gone}"`, () =>
          expect(text.toLowerCase()).not.toContain(gone.toLowerCase()));
      }

      // The whole vegan recipe, so any change to a conversion shows up in
      // review. After an intended change, run `npm test -- -u`.
      it("matches the saved vegan version", () => {
        expect(text).toMatchSnapshot();
      });
    });
  }
});

describe("the cook's swap choices", () => {
  const recipe = convert(readRecipe("01-pancakes.txt"));
  const milk = recipe.swaps.findIndex((swap) => swap.ingredient === "Milk");
  const lineWithMilk = (choice: Parameters<typeof applySwapChoices>[1]) =>
    applySwapChoices(recipe, choice).lines.find((line) =>
      line.original.includes("milk")
    )?.vegan;

  it("uses the suggested swap by default", () => {
    expect(lineWithMilk({})).toBe("1 cup unsweetened oat milk");
  });

  it("can switch to the alternative", () => {
    expect(lineWithMilk({ [milk]: "alternative" })).toBe(
      "1 cup soy or almond milk"
    );
  });

  it("can keep the original ingredient", () => {
    expect(lineWithMilk({ [milk]: "original" })).toBe("1 cup milk");
  });
});
