"use client";

import { useState, type ReactNode } from "react";
import type { SwapChoice, SwapChoices } from "@/lib/ingredients/swapChoices";
import type { RecipeSwap, VeganizedRecipe } from "@/lib/ingredients/veganize";
import type { SwapReportReason } from "@/lib/api/swapReports";
import { colors } from "@/lib/theme/colors";
import Expandable from "@/components/ui/Expandable";
import NeoWindow from "@/components/ui/NeoWindow";
import DeeperDetails from "./DeeperDetails";
import ReportSwapForm from "./ReportSwapForm";

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

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The one-line answer shown above the recipe: what kind of result it is and
// what was done to it.
export function recipeVerdict(recipe: VeganizedRecipe) {
  const swapped = recipe.swaps.filter((swap) => swap.replacement && !swap.kept);
  const kept = recipe.swaps.filter((swap) => swap.kept);
  const toCheck = recipe.swaps.filter((swap) => !swap.replacement);

  const details = [
    swapped.length ? plural(swapped.length, "substitution") + " made" : "",
    toCheck.length ? plural(toCheck.length, "label") + " to check" : "",
    kept.length ? `${kept.length} kept as original` : ""
  ].filter(Boolean);

  if (recipe.swaps.length === 0) {
    return {
      title: "Already vegan",
      body: "Nothing in this recipe needs swapping.",
      color: colors.primary
    };
  }
  if (kept.some((swap) => swap.status === "non_vegan")) {
    return {
      title: "Not fully vegan",
      body: details.join(" · "),
      color: colors.alert
    };
  }
  if (toCheck.length > 0 || kept.length > 0) {
    return {
      title: "Nearly vegan",
      body: details.join(" · "),
      color: colors.secondary
    };
  }
  return {
    title: "Vegan version",
    body: details.join(" · "),
    color: colors.primary
  };
}

type Props = {
  recipe: VeganizedRecipe;
  // The big heading; the recipe's own title when left out.
  heading?: string;
  // Shown under the verdict, such as when a saved recipe was saved.
  subtitle?: string;
  // The cook's picks. Without onChoose the swaps are read-only.
  choices?: SwapChoices;
  onChoose?: (swap: number, choice: SwapChoice | undefined) => void;
  // Hides the Vegan/Original switch when the page has its own tabs.
  hideVersionToggle?: boolean;
  // Buttons placed right under the recipe, above the swap details.
  actions?: ReactNode;
  // Sends a report that a swap is wrong. Without it there is no Report link.
  onReport?: (
    swap: number,
    reason: SwapReportReason,
    note: string
  ) => Promise<void>;
};

const chip =
  "border-2 border-[#000000] px-2 py-1 text-xs font-black uppercase tracking-[0.04em] min-h-[44px]";

function ChoiceChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={chip}
      style={{
        backgroundColor: active ? colors.primary : colors.white,
        color: active ? colors.white : colors.black
      }}
    >
      {label}
    </button>
  );
}

const statusLabel = { non_vegan: "Not Vegan", unclear: "Maybe" } as const;

// One colored card per flagged ingredient: what it became, the other
// options, and the "Deeper" details, all in one place.
function SwapCard({
  swap,
  index,
  active,
  choice,
  onChoose,
  onReport
}: {
  swap: RecipeSwap;
  index: number;
  active: boolean;
  choice?: SwapChoice;
  onChoose?: Props["onChoose"];
  onReport?: Props["onReport"];
}) {
  // Picks are made on the suggested swap, so read them off the original.
  const suggested =
    choice === "alternative" ? swap.alternative : swap.replacement;
  const alternative =
    choice === "alternative" ? swap.replacement : swap.alternative;
  const variant = swap.status === "non_vegan" ? "not_vegan" : "maybe";
  const canChoose = Boolean(onChoose && swap.replacement);

  const summary = swap.kept
    ? `Kept as ${swap.ingredient}`
    : swap.replacement
      ? `Swap: ${swap.replacement}`
      : swap.note ?? "Check the label";

  return (
    <li
      id={`swap-${index}`}
      className={`scroll-mt-24 transition-all duration-300 ease-out ${
        active ? "relative z-20 scale-[1.02]" : ""
      }`}
      style={{
        outline: active ? `4px solid ${colors.black}` : undefined
      }}
    >
      <NeoWindow title={swap.ingredient} variant={variant} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 text-sm font-black uppercase tracking-[0.08em]">
            <p className="shrink-0">{statusLabel[swap.status]}</p>
            <p className="text-right">{summary}</p>
          </div>

          {canChoose && onChoose ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={`Swap for ${swap.ingredient}`}
            >
              <ChoiceChip
                label={suggested ?? ""}
                active={!choice}
                onClick={() => onChoose(index, undefined)}
              />
              {alternative ? (
                <ChoiceChip
                  label={alternative}
                  active={choice === "alternative"}
                  onClick={() => onChoose(index, "alternative")}
                />
              ) : null}
              <ChoiceChip
                label={`Keep ${swap.ingredient}`}
                active={choice === "original"}
                onClick={() => onChoose(index, "original")}
              />
            </div>
          ) : null}

          {!onChoose && swap.alternative && !swap.kept ? (
            <p className="text-xs font-black uppercase tracking-[0.04em]">
              Or try: {swap.alternative}
            </p>
          ) : null}

          <Expandable title="Deeper">
            <DeeperDetails
              name={swap.ingredient}
              status={variant}
              reason={swap.about}
              isComplex={swap.complex}
              swap={swap.replacement}
            >
              {canChoose && onReport ? (
                <ReportSwapForm
                  ingredient={swap.ingredient}
                  onSubmit={(reason, note) => onReport(index, reason, note)}
                />
              ) : null}
            </DeeperDetails>
          </Expandable>
        </div>
      </NeoWindow>
    </li>
  );
}

export default function VeganRecipeView({
  recipe,
  heading,
  subtitle,
  choices = {},
  onChoose,
  actions,
  onReport,
  hideVersionToggle = false
}: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeSwap, setActiveSwap] = useState<number | null>(null);
  const verdict = recipeVerdict(recipe);
  const title = heading ?? veganRecipeTitle(recipe);

  // Swaps keep their index so a highlight can point at its card.
  const indexed = recipe.swaps.map((swap, index) => ({ swap, index }));
  // Swaps first, then the ones that only need a label check.
  const cards = [
    ...indexed.filter(({ swap }) => swap.replacement),
    ...indexed.filter(({ swap }) => !swap.replacement)
  ];

  function focusSwap(index: number) {
    setActiveSwap(index);
    window.setTimeout(() => setActiveSwap(null), 1500);
    document
      .getElementById(`swap-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <section
        className="print-recipe border-[3px] border-[#000000] shadow-[8px_8px_0px_#000000]"
        style={{ backgroundColor: colors.white, color: colors.black }}
      >
        <div className="border-b-[3px] border-[#000000] p-4">
          <h1 className="text-2xl font-black uppercase leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.04em]">
            {verdict.body}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.04em] opacity-70">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="p-4">
          <div
            className={
              hideVersionToggle
                ? "hidden"
                : "mb-4 inline-flex border-2 border-[#000000]"
            }
            role="group"
            aria-label="Show recipe version"
          >
            {[false, true].map((original) => (
              <button
                key={String(original)}
                type="button"
                onClick={() => setShowOriginal(original)}
                aria-pressed={showOriginal === original}
                className="min-h-[44px] px-3 text-xs font-black uppercase tracking-[0.06em]"
                style={{
                  backgroundColor:
                    showOriginal === original ? colors.black : colors.white,
                  color: showOriginal === original ? colors.white : colors.black
                }}
              >
                {original ? "Original" : "Vegan"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 text-sm font-bold leading-6">
            {recipe.lines.map((line, i) =>
              line.kind === "heading" &&
              line.original === title ? null : line.kind === "heading" ? (
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
                        part.swap === undefined ||
                        recipe.swaps[part.swap]?.kept ? (
                          <span key={j}>{part.text}</span>
                        ) : (
                          <button
                            key={j}
                            type="button"
                            onClick={() => focusSwap(part.swap as number)}
                            className="inline px-1 text-left font-black underline decoration-2 underline-offset-2"
                            style={{
                              backgroundColor: colors.secondary,
                              color: colors.black
                            }}
                            title={`Swapped for ${recipe.swaps[part.swap]?.ingredient}. Tap to change.`}
                          >
                            {part.text}
                          </button>
                        )
                      )}
                </p>
              )
            )}
          </div>
          <p className="mt-6 hidden text-xs font-bold uppercase tracking-[0.04em] print:block">
            Made vegan with Vegan Eyes
          </p>
        </div>
      </section>

      {actions}

      {cards.length > 0 ? (
        <section data-tour="swaps" className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.06em]">
            Swaps
          </h2>
          {onChoose ? (
            <p className="-mt-2 text-xs font-bold">
              Pick a swap on any card, or keep the original. Tap a highlighted
              word in the recipe to jump to its card.
            </p>
          ) : null}
          <ul className="flex flex-col gap-6">
            {cards.map(({ swap, index }) => (
              <SwapCard
                key={swap.ingredient}
                swap={swap}
                index={index}
                active={activeSwap === index}
                choice={choices[index]}
                onChoose={onChoose}
                onReport={onReport}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
