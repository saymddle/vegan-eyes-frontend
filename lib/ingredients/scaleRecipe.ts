import { normalize } from "./matcher";
import { RECIPE_RULES } from "./recipeSwaps";
import { matchCase, type VeganizedRecipe } from "./veganize";

const UNICODE: Record<string, number> = {
  "½": 1 / 2,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8
};
const FRACTION_CHARS = Object.keys(UNICODE).join("");
// One amount: "1 1/2", "1½", "3/4", "2.5", "400" or "½".
const NUMBER = `(?:\\d+\\s+\\d+\\/\\d+|\\d+[${FRACTION_CHARS}]|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[${FRACTION_CHARS}])`;
// A line's leading amount, or range of amounts: "2-3 cloves garlic".
const LEADING = new RegExp(`^(${NUMBER})(\\s*(?:-|–|to)\\s*)?(${NUMBER})?`);
// "Serves 4", "Servings: 6", "Makes 12 cookies", "4 servings".
const SERVINGS =
  /\b(?:serves|servings?|yields?|makes)\s*:?\s*(\d+)|\b(\d+)\s+(?:servings|portions|people)\b/i;

function parseAmount(text: string) {
  const value = text.trim();
  if (UNICODE[value] !== undefined) return UNICODE[value];
  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const attached = value.match(/^(\d+)(.)$/);
  if (attached && UNICODE[attached[2]] !== undefined) {
    return Number(attached[1]) + UNICODE[attached[2]];
  }
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(value);
}

// 1.5 reads as "1½", 0.333 as "⅓", 22.5 g as "23".
export function formatAmount(value: number) {
  if (value >= 10) return String(Math.round(value));
  const whole = Math.floor(value);
  const rest = value - whole;
  if (rest < 0.04) return String(whole || value.toFixed(2));
  if (rest > 0.96) return String(whole + 1);
  for (const [char, fraction] of Object.entries(UNICODE)) {
    if (Math.abs(rest - fraction) < 0.02) return `${whole || ""}${char}`;
  }
  return String(Math.round(value * 100) / 100);
}

function scaleLeading(text: string, factor: number) {
  return text.replace(LEADING, (_, first, between, second) => {
    const scaled = formatAmount(parseAmount(first) * factor);
    if (!between || !second) return scaled + (between ?? "");
    return `${scaled}${between}${formatAmount(parseAmount(second) * factor)}`;
  });
}

// The servings the recipe says it makes, if it says.
export function findServings(recipe: VeganizedRecipe) {
  for (const line of recipe.lines) {
    const found = line.original.match(SERVINGS);
    const count = Number(found?.[1] ?? found?.[2]);
    if (count > 0 && count < 100) return count;
  }
  return null;
}

// Multiplies every ingredient amount by `factor`, so "2 cups flour" at
// double becomes "4 cups flour". Steps are left alone, and the servings line
// shows the new count.
export function scaleRecipe(
  recipe: VeganizedRecipe,
  factor: number
): VeganizedRecipe {
  if (factor === 1) return recipe;
  const base = findServings(recipe);

  const lines = recipe.lines.map((line) => {
    const servings = line.original.match(SERVINGS);
    if (servings && base) {
      const count = String(Math.round(base * factor));
      const swapCount = (text: string) =>
        text.replace(SERVINGS, (match) => match.replace(/\d+/, count));
      const parts = line.parts.map((part) => ({
        ...part,
        text: swapCount(part.text)
      }));
      return {
        ...line,
        original: swapCount(line.original),
        vegan: parts.map((part) => part.text).join(""),
        parts
      };
    }

    if (line.kind !== "ingredient" || !LEADING.test(line.original)) {
      return line;
    }

    const parts = line.parts.map((part, at) => {
      if (at > 0) return part;
      if (part.swap === undefined || !part.original) {
        return { ...part, text: scaleLeading(part.text, factor) };
      }
      // The swap took in the amount ("2 large eggs" became "2 flax eggs
      // (...)"), so rebuild it from the scaled amount.
      const original = scaleLeading(part.original, factor);
      const swap = recipe.swaps[part.swap];
      let text = part.text;
      if (swap?.kept) text = original;
      else if (text.endsWith(`(in place of ${part.original})`)) {
        text = text.replace(
          `(in place of ${part.original})`,
          `(in place of ${original})`
        );
      } else {
        const rule = swap
          ? RECIPE_RULES[normalize(swap.ingredient)]
          : undefined;
        const amount = part.original.match(LEADING)?.[1];
        text =
          rule?.withQuantity && amount
            ? matchCase(rule.withQuantity(parseAmount(amount) * factor), true)
            : scaleLeading(text, factor);
      }
      return { ...part, text, original };
    });

    return {
      ...line,
      original: scaleLeading(line.original, factor),
      vegan: parts.map((part) => part.text).join(""),
      parts
    };
  });

  return { ...recipe, lines };
}
