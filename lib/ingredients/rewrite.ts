// AI rewording of a converted recipe's steps. The database decides what is
// vegan and what each swap is; the AI only adjusts the cooking steps to suit
// the swaps ("rest the flax egg 5 minutes"). Every rewritten step is checked
// against the database again, and a step that fails keeps its plain wording.

import {
  matchLine,
  normalize,
  toStatus,
  type IngredientIndex
} from "./matcher";
import type { LinePart, VeganizedRecipe } from "./veganize";

export type RewriteRequest = {
  title: string | null;
  // The vegan ingredient list, for context.
  ingredients: string[];
  // The vegan steps, in order.
  steps: string[];
  // What was swapped: "milk" became "unsweetened oat milk".
  swaps: { from: string; to: string }[];
};

// null keeps the plain step.
export type RewriteResult = { steps: (string | null)[] };

export const MAX_STEPS = 40;
export const MAX_CHARS = 8000;

// The request for a converted recipe, or null when there is nothing to
// reword: no steps, or nothing swapped.
export function rewriteRequest(recipe: VeganizedRecipe): RewriteRequest | null {
  const steps = recipe.lines.filter((line) => line.kind === "step");
  const swaps = recipe.swaps
    .filter((swap) => swap.replacement && !swap.kept)
    .map((swap) => ({ from: swap.ingredient, to: swap.replacement as string }));
  if (!steps.length || !swaps.length) return null;

  const request: RewriteRequest = {
    title: recipe.title,
    ingredients: recipe.lines
      .filter((line) => line.kind === "ingredient")
      .map((line) => line.vegan),
    steps: steps.map((line) => line.vegan),
    swaps
  };
  return isReasonableRequest(request) ? request : null;
}

export function isReasonableRequest(request: RewriteRequest) {
  const size = JSON.stringify(request).length;
  return (
    Array.isArray(request.steps) &&
    request.steps.length > 0 &&
    request.steps.length <= MAX_STEPS &&
    request.steps.every((step) => typeof step === "string") &&
    Array.isArray(request.swaps) &&
    size <= MAX_CHARS
  );
}

function nonVeganCount(text: string, index: IngredientIndex) {
  return matchLine(normalize(text), index).filter(
    (match) => toStatus(match.row.vegan_status) === "non_vegan"
  ).length;
}

// A rewritten step is kept only if it adds nothing non-vegan and stays
// about the same size as the step it replaces.
export function acceptStep(
  plain: string,
  rewritten: unknown,
  index: IngredientIndex
): string | null {
  if (typeof rewritten !== "string") return null;
  let text = rewritten.replace(/\s+/g, " ").trim();
  // Keep the step's own number ("2. Melt...") if the rewording dropped it.
  const number = /^\d+[.)]\s*/.exec(plain)?.[0];
  if (number && text && !/^\d+[.)]/.test(text)) text = number + text;
  if (!text || text === plain) return null;
  if (text.length > plain.length * 2 + 160) return null;
  if (nonVeganCount(text, index) > nonVeganCount(plain, index)) return null;
  return text;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Splits a rewritten step so the swapped words are still highlighted (and
// still tap through to their swap), wherever the rewrite put them.
function highlight(text: string, swapped: LinePart[]): LinePart[] {
  let parts: LinePart[] = [{ text }];
  for (const part of swapped) {
    const find = new RegExp(`\\b${escapeRegex(part.text)}\\b`, "i");
    let done = false;
    parts = parts.flatMap((piece) => {
      if (done || piece.swap !== undefined) return [piece];
      const found = find.exec(piece.text);
      if (!found) return [piece];
      done = true;
      const before = piece.text.slice(0, found.index);
      const after = piece.text.slice(found.index + found[0].length);
      return [
        ...(before ? [{ text: before }] : []),
        { ...part, text: found[0] },
        ...(after ? [{ text: after }] : [])
      ];
    });
  }
  return parts;
}

// Puts the accepted rewritten steps into the recipe.
export function applyRewrite(
  recipe: VeganizedRecipe,
  rewritten: (string | null)[]
): VeganizedRecipe {
  let step = -1;
  const lines = recipe.lines.map((line) => {
    if (line.kind !== "step") return line;
    step += 1;
    const text = rewritten[step];
    if (!text) return line;
    const swapped = line.parts.filter((part) => part.swap !== undefined);
    return { ...line, vegan: text, parts: highlight(text, swapped) };
  });
  return { ...recipe, lines };
}

export const REWRITE_PROMPT = `You help home cooks make recipes vegan.
A recipe has already been converted: animal ingredients were swapped for plant-based ones. The swaps are final; never change, add or remove an ingredient, and never mention any animal product.
Your job: reword the cooking steps so the method works with the swaps. Adjust technique, timing, heat or texture cues where a swap needs it (for example, a flax egg needs 5 minutes to thicken before use; tofu should be pressed; vegan butter browns faster). Leave a step exactly as it is when it needs no change.
Keep each step's meaning, order, amounts, times and temperatures unless the swap requires a change. Keep the cook's tone: short, plain, imperative sentences. Do not add new steps or tips outside the steps.
Reply with JSON only: {"steps": ["step 1 text", "step 2 text", ...]} with exactly one string per input step, in the same order.`;

export function rewriteMessages(request: RewriteRequest) {
  const swaps = request.swaps
    .map((swap) => `- ${swap.from} -> ${swap.to}`)
    .join("\n");
  const steps = request.steps
    .map((step, at) => `${at + 1}. ${step}`)
    .join("\n");
  return [
    { role: "system", content: REWRITE_PROMPT },
    {
      role: "user",
      content: `Recipe: ${request.title ?? "Untitled"}

Swaps made:
${swaps}

Vegan ingredients:
${request.ingredients.join("\n")}

Steps (${request.steps.length}):
${steps}`
    }
  ];
}
