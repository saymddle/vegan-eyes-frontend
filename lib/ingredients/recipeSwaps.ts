// Recipe-ready swaps for the ingredients home cooks meet most. The database
// swaps are written for labels ("Oat milk or soy milk", "Vegan egg replacer
// (JUST Egg)"); these read as something you can measure out and cook with.
// Anything not listed here falls back to the database swap.

export type RecipeRule = {
  replacement: string;
  alternative?: string;
  // Rewrites "2 eggs" as a whole, quantity included.
  withQuantity?: (quantity: number) => string;
};

function amount(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

const flaxEggs = (count: number) =>
  `${amount(count)} flax ${count === 1 ? "egg" : "eggs"} (${amount(count)} tbsp ground flaxseed + ${amount(count * 3)} tbsp water, rested 5 min)`;

const milk: RecipeRule = {
  replacement: "unsweetened oat milk",
  alternative: "soy or almond milk"
};
const cream: RecipeRule = {
  replacement: "full-fat coconut cream",
  alternative: "cashew cream"
};
const broth: RecipeRule = {
  replacement: "vegetable broth",
  alternative: "mushroom broth for a richer flavor"
};
const chicken: RecipeRule = {
  replacement: "seitan",
  alternative: "extra-firm tofu or chickpeas",
  // "4 chicken breasts, 150-180g each" reads as "4 seitan cutlets, 150-180g each".
  withQuantity: (count) => `${amount(count)} seitan ${count === 1 ? "cutlet" : "cutlets"}`
};
const beef: RecipeRule = {
  replacement: "plant-based mince",
  alternative: "cooked lentils or chopped mushrooms"
};

export const RECIPE_RULES: Record<string, RecipeRule> = {
  egg: {
    replacement: "flax eggs",
    alternative: "JUST Egg for scrambles, or 3 tbsp aquafaba per egg in baking",
    withQuantity: flaxEggs
  },
  "egg white": {
    replacement: "aquafaba",
    alternative: "commercial egg-white replacer",
    withQuantity: (count) => `${amount(count * 3)} tbsp aquafaba`
  },
  milk,
  "whole milk": milk,
  "skimmed milk": milk,
  "low fat milk": milk,
  buttermilk: {
    replacement: "soy milk with 1 tbsp lemon juice per cup",
    alternative: "oat milk with apple cider vinegar"
  },
  butter: {
    replacement: "vegan butter",
    alternative: "coconut oil in baking, olive oil for cooking"
  },
  ghee: { replacement: "vegan butter", alternative: "coconut oil" },
  cream,
  "heavy cream": cream,
  "whipping cream": cream,
  "sour cream": {
    replacement: "vegan sour cream",
    alternative: "cashew cream with a squeeze of lemon"
  },
  yogurt: {
    replacement: "unsweetened soy yogurt",
    alternative: "coconut yogurt"
  },
  "cream cheese": { replacement: "vegan cream cheese" },
  cheese: {
    replacement: "vegan cheese",
    alternative: "nutritional yeast for a cheesy flavor"
  },
  parmesan: {
    replacement: "vegan parmesan",
    alternative: "nutritional yeast"
  },
  mozzarella: { replacement: "vegan mozzarella" },
  cheddar: { replacement: "vegan cheddar" },
  ricotta: {
    replacement: "tofu ricotta",
    alternative: "cashew ricotta"
  },
  honey: { replacement: "maple syrup", alternative: "agave nectar" },
  gelatin: {
    replacement: "agar agar",
    alternative: "pectin for jams"
  },
  chicken,
  "chicken breast": chicken,
  "chicken thigh": chicken,
  beef,
  "ground beef": beef,
  "chicken stock": broth,
  "chicken broth": broth,
  "beef stock": broth,
  "beef broth": broth,
  stock: broth,
  bacon: {
    replacement: "tempeh bacon",
    alternative: "smoked coconut flakes"
  },
  "fish sauce": {
    replacement: "soy sauce with a pinch of crumbled nori",
    alternative: "vegan fish sauce"
  },
  anchovies: { replacement: "capers", alternative: "chopped nori" },
  mayonnaise: { replacement: "vegan mayonnaise" }
};

// Words that can sit between the quantity and the ingredient: "2 large eggs".
export const SIZE_WORDS = "(?:large|medium|small|whole|extra[ -]large|boneless|skinless)";

export function parseQuantity(text: string) {
  const value = text.trim();
  const unicode: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
  if (unicode[value] !== undefined) return unicode[value];
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
