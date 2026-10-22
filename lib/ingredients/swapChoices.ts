import {
  matchCase,
  toTitleCase,
  type LinePart,
  type VeganizedRecipe
} from "./veganize";

// What the cook picked for a swap; no entry means the suggested replacement.
export type SwapChoice = "alternative" | "original";
export type SwapChoices = Record<number, SwapChoice>;

const AMOUNT = /^[\d./½¼¾⅓⅔]+\s/;

function chosenText(part: LinePart, alternative: string) {
  const text = part.titleCase
    ? toTitleCase(alternative)
    : matchCase(alternative, /^[A-Z]/.test(part.text));
  // A swap that rewrote the amount ("4 chicken breasts" as "4 seitan
  // cutlets") does not carry over to the alternative ("4 chickpeas"), so
  // say what it stands in for instead.
  return part.original && AMOUNT.test(part.original)
    ? `${text} (in place of ${part.original})`
    : text;
}

// Applies the cook's picks so the recipe that is shown, copied and saved is
// the one they chose.
export function applySwapChoices(
  recipe: VeganizedRecipe,
  choices: SwapChoices
): VeganizedRecipe {
  if (Object.keys(choices).length === 0) return recipe;

  const lines = recipe.lines.map((line) => {
    const parts = line.parts.map((part) => {
      const choice = part.swap === undefined ? undefined : choices[part.swap];
      if (!choice) return part;
      if (choice === "original") {
        return { ...part, text: part.original ?? part.text };
      }
      const alternative = recipe.swaps[part.swap as number].alternative;
      if (!alternative) return part;
      const text = chosenText(part, alternative);
      return {
        ...part,
        text: part.keepWord ? `${text} ${part.original}` : text
      };
    });
    return { ...line, parts, vegan: parts.map((part) => part.text).join("") };
  });

  const swaps = recipe.swaps.map((swap, at) => {
    const choice = choices[at];
    if (choice === "original") return { ...swap, kept: true };
    if (choice === "alternative" && swap.alternative) {
      return {
        ...swap,
        replacement: swap.alternative,
        alternative: swap.replacement
      };
    }
    return swap;
  });

  return { ...recipe, lines, swaps };
}
