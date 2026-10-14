"use client";

import { useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import { colors } from "@/lib/theme/colors";

export const recipeStatusCopy = {
  vegan: {
    variant: "vegan",
    title: "Already vegan",
    body: "Nothing in this recipe needs swapping."
  },
  non_vegan: {
    variant: "vegan",
    title: "Vegan version",
    body: "The swapped ingredients are highlighted below."
  },
  unclear: {
    variant: "maybe",
    title: "Nearly vegan",
    body: "A few ingredients need a quick label check."
  }
} as const;

export function veganRecipeText(recipe: VeganizedRecipe) {
  return recipe.lines
    .map((line) => (line.kind === "heading" ? `\n${line.vegan}` : line.vegan))
    .join("\n")
    .trim();
}

// A recipe's title, or its first line when the scan had no heading.
export function veganRecipeTitle(recipe: VeganizedRecipe) {
  // Pasted recipes often start at "Ingredients", so name it after the main
  // thing that was swapped rather than its first ingredient line.
  const main = recipe.swaps.find((swap) => swap.replacement);
  return recipe.title || (main ? `Vegan ${main.ingredient}` : "Vegan recipe");
}

type Props = {
  recipe: VeganizedRecipe;
};

export default function VeganRecipeView({ recipe }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const replaced = recipe.swaps.filter((swap) => swap.replacement);
  const toCheck = recipe.swaps.filter((swap) => !swap.replacement);

  return (
    <>
      <NeoWindow
        title={showOriginal ? "Original" : "Vegan Recipe"}
        variant="vegan"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <NeoButton
              onClick={() => setShowOriginal(false)}
              tone={showOriginal ? "base" : "secondary"}
              className="text-xs"
            >
              Vegan
            </NeoButton>
            <NeoButton
              onClick={() => setShowOriginal(true)}
              tone={showOriginal ? "secondary" : "base"}
              className="text-xs"
            >
              Original
            </NeoButton>
          </div>

          <div
            className="flex flex-col gap-2 border-[3px] border-[#000000] p-4 text-sm font-bold leading-6"
            style={{ backgroundColor: colors.white, color: colors.black }}
          >
            {recipe.lines.map((line, i) =>
              line.kind === "heading" ? (
                <h2
                  key={i}
                  className="mt-2 text-base font-black uppercase tracking-[0.06em] first:mt-0"
                >
                  {line.original}
                </h2>
              ) : (
                <p key={i} className={line.kind === "step" ? "mt-1" : ""}>
                  {showOriginal
                    ? line.original
                    : line.parts.map((part, j) =>
                        part.swap === undefined ? (
                          <span key={j}>{part.text}</span>
                        ) : (
                          <mark
                            key={j}
                            className="px-1 font-black"
                            style={{
                              backgroundColor: colors.secondary,
                              color: colors.black
                            }}
                          >
                            {part.text}
                          </mark>
                        )
                      )}
                </p>
              )
            )}
          </div>
        </div>
      </NeoWindow>

      {replaced.length > 0 ? (
        <NeoWindow title="Swaps" variant="maybe" size="md">
          <ul className="flex flex-col gap-3">
            {replaced.map((swap) => (
              <li
                key={swap.ingredient}
                className="border-[3px] border-[#000000] p-3 text-sm font-bold"
                style={{ backgroundColor: colors.white, color: colors.black }}
              >
                <p className="font-black uppercase tracking-[0.04em]">
                  {swap.ingredient} → {swap.replacement}
                </p>
                {swap.alternative ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.04em]">
                    Or try: {swap.alternative}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </NeoWindow>
      ) : null}

      {toCheck.length > 0 ? (
        <NeoWindow title="Check the label" variant="maybe" size="md">
          <ul className="flex flex-col gap-3">
            {toCheck.map((swap) => (
              <li
                key={swap.ingredient}
                className="border-[3px] border-[#000000] p-3 text-sm font-bold"
                style={{ backgroundColor: colors.white, color: colors.black }}
              >
                <p className="font-black uppercase tracking-[0.04em]">
                  {swap.ingredient}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.04em]">
                  {swap.note}
                </p>
              </li>
            ))}
          </ul>
        </NeoWindow>
      ) : null}
    </>
  );
}
