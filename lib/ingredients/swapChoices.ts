import { matchCase, type LinePart, type VeganizedRecipe } from "./veganize";

// What the cook picked for a swap; no entry means the suggested replacement.
export type SwapChoice = "alternative" | "original";
export type SwapChoices = Record<number, SwapChoice>;

const AMOUNT = /^[\d./½¼¾⅓⅔]+\s/;

function chosenText(part: LinePart, alternative: string) {
  const amount = part.original?.match(AMOUNT)?.[0] ?? "";
  return amount + matchCase(alternative, /^[A-Z]/.test(part.text));
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
      return alternative
        ? { ...part, text: chosenText(part, alternative) }
        : part;
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
