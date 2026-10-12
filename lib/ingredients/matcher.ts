import type { BackendIngredient } from "@/lib/types/check";

export type IngredientRow = {
  name: string;
  vegan_status: string | null;
  lab_note: string | null;
  swap_static: string | null;
  swap_functional: string | null;
  is_complex: boolean | null;
  aliases: string | null;
};

export type SynonymRow = {
  alias: string;
  ingredient_name: string;
};

export type Status = "vegan" | "non_vegan" | "unclear";

const severity: Record<Status, number> = {
  vegan: 0,
  unclear: 1,
  non_vegan: 2
};

export type IngredientIndex = {
  // Matched anywhere inside an ingredient line (names and synonyms).
  terms: Map<string, IngredientRow>;
  // Matched only when they are the whole ingredient line. Aliases are
  // sometimes category tags ("Pastry", "Seafood"), so they are too loose to
  // match inside longer text.
  exact: Map<string, IngredientRow>;
  maxWords: number;
};

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function toStatus(value: string | null): Status {
  return value === "non_vegan" || value === "unclear" ? value : "vegan";
}

function richness(row: IngredientRow) {
  return [row.lab_note, row.swap_static, row.swap_functional].filter(Boolean)
    .length;
}

// When a term points at several rows, keep the most cautious status, then the
// row with the most detail.
function prefer(current: IngredientRow | undefined, next: IngredientRow) {
  if (!current) return next;
  const diff =
    severity[toStatus(next.vegan_status)] -
    severity[toStatus(current.vegan_status)];
  if (diff !== 0) return diff > 0 ? next : current;
  return richness(next) > richness(current) ? next : current;
}

function add(map: Map<string, IngredientRow>, term: string, row: IngredientRow) {
  const key = normalize(term);
  if (key) map.set(key, prefer(map.get(key), row));
}

export function buildIndex(
  rows: IngredientRow[],
  synonyms: SynonymRow[]
): IngredientIndex {
  const terms = new Map<string, IngredientRow>();
  const exact = new Map<string, IngredientRow>();
  const byName = new Map<string, IngredientRow>();

  rows.forEach((row) => {
    add(terms, row.name, row);
    add(byName, row.name, row);
    (row.aliases || "").split(",").forEach((alias) => add(exact, alias, row));
  });

  synonyms.forEach((synonym) => {
    const row = byName.get(normalize(synonym.ingredient_name));
    if (row) add(terms, synonym.alias, row);
  });

  // A real ingredient name beats another row's alias ("cocoa" is its own
  // row, and also an alias of "Chocolate").
  terms.forEach((row, term) => exact.set(term, row));

  let maxWords = 1;
  terms.forEach((_, term) => {
    maxWords = Math.max(maxWords, term.split(" ").length);
  });

  return { terms, exact, maxWords };
}

export function splitIngredients(input: string) {
  return input
    .split(/[,;\n()[\]{}]+/)
    .map(normalize)
    .filter(Boolean);
}

const QUANTITY_WORDS = new Set([
  "tsp", "teaspoon", "teaspoons", "tbsp", "tablespoon", "tablespoons",
  "cup", "cups", "oz", "g", "kg", "ml", "l", "lb", "lbs", "pinch", "of"
]);

function singular(word: string) {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (/(ses|xes|ches|shes|oes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

// Looks a phrase up as written, then with its last word made singular, so
// "eggs" finds "egg" and "butter beans" finds "butter bean".
function lookup(map: Map<string, IngredientRow>, words: string[]) {
  const phrase = words.join(" ");
  const found = map.get(phrase);
  if (found) return found;
  const last = words[words.length - 1];
  const single = singular(last);
  return single === last
    ? undefined
    : map.get([...words.slice(0, -1), single].join(" "));
}

export type LineMatch = {
  row: IngredientRow;
  // The normalized words of the line that matched, e.g. ["heavy", "cream"].
  words: string[];
};

// Finds the database rows mentioned in one ingredient line, longest phrase
// first, so "soy lecithin" wins over "lecithin".
export function matchLine(line: string, index: IngredientIndex): LineMatch[] {
  const words = line.split(" ");
  const named = words.filter(
    (word) => !/^\d+$/.test(word) && !QUANTITY_WORDS.has(word)
  );

  const whole = named.length ? lookup(index.exact, named) : undefined;
  if (whole) return [{ row: whole, words: named }];

  const used = new Array<boolean>(words.length).fill(false);
  const found: LineMatch[] = [];

  for (let size = Math.min(index.maxWords, words.length); size > 0; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      if (used.slice(start, start + size).some(Boolean)) continue;
      const phrase = words.slice(start, start + size);
      const row = lookup(index.terms, phrase);
      if (!row) continue;
      found.push({ row, words: phrase });
      used.fill(true, start, start + size);
    }
  }

  return found;
}

export function checkIngredients(
  input: string,
  index: IngredientIndex
): BackendIngredient[] {
  const flagged = new Map<string, BackendIngredient>();

  splitIngredients(input).forEach((line) => {
    matchLine(line, index).forEach(({ row }) => {
      const status = toStatus(row.vegan_status);
      const key = normalize(row.name);
      if (status === "vegan" || flagged.has(key)) return;

      flagged.set(key, {
        name: row.name,
        vegan_status: status,
        is_complex: row.is_complex ?? false,
        swap_static: row.swap_static ?? undefined,
        swap_functional: row.swap_functional ?? undefined,
        nourishment_fact: row.lab_note ?? undefined
      });
    });
  });

  return [...flagged.values()];
}
