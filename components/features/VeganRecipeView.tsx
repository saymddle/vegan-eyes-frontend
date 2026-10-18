"use client";

import { useState, type ReactNode } from "react";
import type { SwapChoice, SwapChoices } from "@/lib/ingredients/swapChoices";
import type { RecipeSwap, VeganizedRecipe } from "@/lib/ingredients/veganize";
import type { SwapReportReason } from "@/lib/api/swapReports";
import { colors } from "@/lib/theme/colors";
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
    swapped.length ? plural(swapped.length, "swap") + " made" : "",
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
  // Shown under the verdict, such as when a saved recipe was saved.
  subtitle?: string;
  // The cook's picks. Without onChoose the swaps are read-only.
  choices?: SwapChoices;
  onChoose?: (swap: number, choice: SwapChoice | undefined) => void;
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
  "border-2 border-[#000000] px-2 py-1 text-xs font-black uppercase tracking-[0.04em] min-h-[36px]";

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

function SwapItem({
  swap,
  index,
  active,
  choice,
  onChoose,
  onToggle,
  onReport
}: {
  swap: RecipeSwap;
  index: number;
  active: boolean;
  choice?: SwapChoice;
  onChoose?: Props["onChoose"];
  onToggle: () => void;
  onReport?: Props["onReport"];
}) {
  // Picks are made on the suggested swap, so read them off the original.
  const suggested =
    choice === "alternative" ? swap.alternative : swap.replacement;
  const alternative =
    choice === "alternative" ? swap.replacement : swap.alternative;

  const header = swap.kept
    ? `${swap.ingredient} (kept)`
    : `${swap.ingredient} → ${swap.replacement}`;

  return (
    <li
      id={`swap-${index}`}
      className="scroll-mt-24 border-2 border-[#000000] text-sm font-bold"
      style={{
        backgroundColor: colors.white,
        color: colors.black,
        outline: active ? `3px solid ${colors.secondary}` : undefined
      }}
    >
      {onChoose ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={active}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 p-3 text-left"
        >
          <span className="font-black uppercase tracking-[0.04em]">
            {header}
          </span>
          <span className="shrink-0 text-xs font-black uppercase underline underline-offset-4">
            {active ? "Done" : "Change"}
          </span>
        </button>
      ) : (
        <p className="p-3 font-black uppercase tracking-[0.04em]">{header}</p>
      )}

      {onChoose && active ? (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
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

      {onChoose && active && onReport ? (
        <ReportSwapForm
          ingredient={swap.ingredient}
          onSubmit={(reason, note) => onReport(index, reason, note)}
        />
      ) : null}

      {!onChoose && swap.alternative && !swap.kept ? (
        <p className="-mt-2 px-3 pb-3 text-xs uppercase tracking-[0.04em]">
          Or try: {swap.alternative}
        </p>
      ) : null}
    </li>
  );
}

export default function VeganRecipeView({
  recipe,
  subtitle,
  choices = {},
  onChoose,
  actions,
  onReport
}: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeSwap, setActiveSwap] = useState<number | null>(null);
  const verdict = recipeVerdict(recipe);
  const title = veganRecipeTitle(recipe);

  // Swaps keep their index so a highlight can point at its card.
  const indexed = recipe.swaps.map((swap, index) => ({ swap, index }));
  const swaps = indexed.filter(({ swap }) => swap.replacement);
  const toCheck = indexed.filter(({ swap }) => !swap.replacement);

  function focusSwap(index: number) {
    setActiveSwap(index);
    document
      .getElementById(`swap-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <section
        className="border-[3px] border-[#000000] shadow-[8px_8px_0px_#000000]"
        style={{ backgroundColor: colors.white, color: colors.black }}
      >
        <div className="border-b-[3px] border-[#000000] p-4">
          <h1 className="text-2xl font-black uppercase leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="border-2 border-[#000000] px-2 py-0.5 text-xs font-black uppercase tracking-[0.06em]"
              style={{
                backgroundColor: verdict.color,
                color:
                  verdict.color === colors.secondary
                    ? colors.black
                    : colors.white
              }}
            >
              {verdict.title}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.04em]">
              {verdict.body}
            </span>
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.04em] opacity-70">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="p-4">
          <div
            className="mb-4 inline-flex border-2 border-[#000000]"
            role="group"
            aria-label="Show recipe version"
          >
            {[false, true].map((original) => (
              <button
                key={String(original)}
                type="button"
                onClick={() => setShowOriginal(original)}
                aria-pressed={showOriginal === original}
                className="min-h-[36px] px-3 text-xs font-black uppercase tracking-[0.06em]"
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
        </div>
      </section>

      {actions}

      {swaps.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.06em]">
            Swaps
          </h2>
          {onChoose ? (
            <p className="-mt-2 text-xs font-bold">
              Tap a highlighted ingredient or a swap below to pick another
              option or keep the original.
            </p>
          ) : null}
          <ul className="flex flex-col gap-3">
            {swaps.map(({ swap, index }) => (
              <SwapItem
                key={swap.ingredient}
                swap={swap}
                index={index}
                active={activeSwap === index}
                choice={choices[index]}
                onChoose={onChoose}
                onReport={onReport}
                onToggle={() =>
                  setActiveSwap(activeSwap === index ? null : index)
                }
              />
            ))}
          </ul>
        </section>
      ) : null}

      {toCheck.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.06em]">
            Check the label
          </h2>
          <ul className="flex flex-col gap-3">
            {toCheck.map(({ swap, index }) => (
              <li
                key={swap.ingredient}
                id={`swap-${index}`}
                className="border-2 border-[#000000] p-3 text-sm font-bold"
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
        </section>
      ) : null}
    </>
  );
}
