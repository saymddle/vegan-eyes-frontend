import type { VeganizedRecipe } from "@shared/ingredients/veganize";

// Same text helpers the website's recipe view used.

export function veganRecipeText(recipe: VeganizedRecipe) {
  return recipe.lines
    .map((line) => (line.kind === "heading" ? `\n${line.vegan}` : line.vegan))
    .join("\n")
    .trim();
}

// A recipe's title, or the main swapped thing when the scan had no heading.
export function veganRecipeTitle(recipe: VeganizedRecipe) {
  const main = recipe.swaps.find((swap) => swap.replacement);
  return recipe.title || (main ? `Vegan ${main.ingredient}` : "Vegan recipe");
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The one line under the recipe heading: what was done to it.
export function recipeSummary(recipe: VeganizedRecipe) {
  if (recipe.swaps.length === 0) return "Nothing in this recipe needs swapping.";
  const swapped = recipe.swaps.filter((swap) => swap.replacement && !swap.kept);
  const kept = recipe.swaps.filter((swap) => swap.kept);
  const toCheck = recipe.swaps.filter((swap) => !swap.replacement);
  return [
    swapped.length ? plural(swapped.length, "substitution") + " made" : "",
    toCheck.length ? plural(toCheck.length, "label") + " to check" : "",
    kept.length ? `${kept.length} kept as original` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// The printed page: just the recipe, like the website's print view.
export function recipePrintHtml(recipe: VeganizedRecipe, heading: string) {
  const body = recipe.lines
    .filter((line) => !(line.kind === "heading" && (line.original === heading || line.vegan === heading)))
    .map((line) =>
      line.kind === "heading" ? `<h2>${escapeHtml(line.vegan)}</h2>` : `<p>${escapeHtml(line.vegan)}</p>`
    )
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#20251F;padding:32px;line-height:1.6;font-size:15px}
h1{color:#214E34;font-size:28px;margin:0 0 4px}h2{color:#214E34;font-size:18px;margin:20px 0 4px}p{margin:4px 0}
.sub{font-size:12px;font-weight:600}.foot{margin-top:28px;font-size:12px;font-weight:600}
</style></head><body><h1>${escapeHtml(heading)}</h1><p class="sub">${escapeHtml(recipeSummary(recipe))}</p>
${body}<p class="foot">Made vegan with Vegan Eyes</p></body></html>`;
}
