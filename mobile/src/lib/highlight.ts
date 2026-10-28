import { foldAccents, loosePattern, WORD_CHAR } from "@shared/ingredients/matcher";
import type { UIIngredient } from "@shared/types/result";

export type Segment = { text: string; ingredient?: UIIngredient };

// Splits the scanned text into plain runs and flagged ingredient names,
// longest name first so "Chicken Parmesan Cutlet" is one highlight.
// Accents don't matter: the "Pate" row highlights "pâté".
export function highlightSegments(text: string, ingredients: UIIngredient[]): Segment[] {
  const byName = new Map<string, UIIngredient>();
  for (const item of ingredients) {
    if (item.status === "vegan" || !item.name.trim()) continue;
    byName.set(foldAccents(item.name.toLowerCase()), item);
  }
  if (!byName.size) return [{ text }];

  const names = [...byName.keys()]
    .sort((a, b) => b.length - a.length)
    .map((name) => loosePattern(name));
  const regex = new RegExp(
    `(?<![${WORD_CHAR}])(${names.join("|")})(?![${WORD_CHAR}])`,
    "gi"
  );

  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    const ingredient = byName.get(foldAccents(match[0].toLowerCase()));
    if (!ingredient) continue;
    if (start > last) segments.push({ text: text.slice(last, start) });
    segments.push({ text: match[0], ingredient });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
