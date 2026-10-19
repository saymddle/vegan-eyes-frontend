import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildIndex,
  matchLine,
  normalize,
  toStatus,
  type IngredientRow,
  type SynonymRow
} from "@/lib/ingredients/matcher";
import { veganizeRecipe } from "@/lib/ingredients/veganize";

// A copy of the Supabase ingredients and synonyms tables, so the tests run
// without a network and give the same answer every time.
const snapshot = JSON.parse(
  readFileSync(join(__dirname, "fixtures/ingredients.json"), "utf8")
) as { ingredients: IngredientRow[]; synonyms: SynonymRow[] };

export const index = buildIndex(snapshot.ingredients, snapshot.synonyms);

export function readRecipe(file: string) {
  return readFileSync(join(__dirname, "recipes", file), "utf8");
}

export function convert(text: string) {
  return veganizeRecipe(text, index);
}

// The worst status found in an ingredient name, as the scanner would show it.
export function statusOf(item: string) {
  const ranks = { vegan: 0, unclear: 1, non_vegan: 2 } as const;
  const found = matchLine(normalize(item), index).map((match) =>
    toStatus(match.row.vegan_status)
  );
  return found.reduce<keyof typeof ranks>(
    (worst, status) => (ranks[status] > ranks[worst] ? status : worst),
    "vegan"
  );
}

export function splitList(list: string) {
  return [
    ...new Set(
      list
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}
