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

// Words that mark the next ingredient as already plant-based: "vegan butter",
// "plant-based milk", "dairy-free cheese".
const VEGAN_MARKERS = [
  "vegan", "plant based", "plantbased", "dairy free", "non dairy", "nondairy",
  "egg free", "eggless", "meat free", "meatless", "faux", "mock"
];

function markedVegan(words: string[], start: number, end: number) {
  const before = (count: number) =>
    start >= count ? words.slice(start - count, start).join(" ") : "";
  return (
    VEGAN_MARKERS.includes(before(1)) ||
    VEGAN_MARKERS.includes(before(2)) ||
    // "egg-free", "dairy free"
    words[end] === "free"
  );
}

// Ingredient words that are also cooking verbs: "Bread the first side",
// "butter the pan", "flour the board". Followed by one of these, they are
// the verb and not the food.
const VERB_NOUNS = new Set([
  "bread", "butter", "cream", "flour", "oil", "grease", "salt", "sugar",
  "crumb", "egg", "stock", "season"
]);
const AFTER_VERB = new Set([
  "the", "a", "an", "it", "them", "each", "both", "your", "all"
]);

function usedAsVerb(words: string[], start: number, size: number) {
  return (
    size === 1 &&
    VERB_NOUNS.has(words[start]) &&
    AFTER_VERB.has(words[start + 1] ?? "")
  );
}

function titleCase(words: string[]) {
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const STATUS_RANK = { vegan: 0, unclear: 1, non_vegan: 2 } as const;

// Two or more flagged items right next to each other name one thing:
// "chicken parmesan cutlet" is one dish, "pizza sauce" one sauce. They
// become a single item with one swap instead of a swap per word.
function compound(parts: (LineMatch & { start: number })[]) {
  const words = parts.flatMap((part) => part.words);
  const status = parts
    .map((part) => toStatus(part.row.vegan_status))
    .reduce((worst, next) =>
      STATUS_RANK[next] > STATUS_RANK[worst] ? next : worst
    );
  const phrase = words.join(" ");
  const row: IngredientRow = {
    name: titleCase(words),
    vegan_status: status,
    lab_note: `Made with ${parts.map((part) => part.row.name.toLowerCase()).join(", ")}.`,
    swap_static: status === "non_vegan" ? `Vegan ${phrase}` : null,
    swap_functional: null,
    is_complex: true,
    aliases: null
  };
  return { row, words, start: parts[0].start };
}

// A word that only repeats what the ingredient before it already is, so
// "cheddar cheese" is one swap and not "vegan cheddar vegan cheese".
const REPEATED_NOUNS = new Set(["cheese", "cheeses"]);

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
  const found: (LineMatch & { start: number })[] = [];
  // Words already marked plant-based ("vegan cheddar").
  const veganSpans: { start: number; end: number }[] = [];

  for (let size = Math.min(index.maxWords, words.length); size > 0; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      if (used.slice(start, start + size).some(Boolean)) continue;
      const phrase = words.slice(start, start + size);
      const row = lookup(index.terms, phrase);
      if (!row) continue;
      if (usedAsVerb(words, start, size)) {
        used[start] = true;
        continue;
      }
      // Skip "butter" in "vegan butter", but keep the words used so a
      // shorter phrase inside it is not matched either.
      if (markedVegan(words, start, start + size)) {
        const end = start + size + (words[start + size] === "free" ? 1 : 0);
        used.fill(true, start, end);
        veganSpans.push({ start, end });
        continue;
      }
      found.push({ row, words: phrase, start });
      used.fill(true, start, start + size);
    }
  }

  found.sort((a, b) => a.start - b.start);

  // "Vegan chicken parmesan" marks the whole name, not just "chicken".
  const unmarked = found.filter((match) => {
    const span = veganSpans.find((vegan) => vegan.end === match.start);
    if (!span) return true;
    span.end = match.start + match.words.length;
    return false;
  });
  found.splice(0, found.length, ...unmarked);

  // Fold "cheese" into the cheese just before it.
  const folded = found.filter((match) => {
    if (match.words.length !== 1 || !REPEATED_NOUNS.has(match.words[0])) {
      return true;
    }
    const before = found.find(
      (other) =>
        other !== match &&
        other.start + other.words.length === match.start &&
        toStatus(other.row.vegan_status) !== "vegan"
    );
    if (!before) return true;
    before.words = [...before.words, ...match.words];
    return false;
  });

  // Join flagged items that sit right next to each other into one.
  const kept: (LineMatch & { start: number })[] = [];
  let group: (LineMatch & { start: number })[] = [];
  const flush = () => {
    if (group.length > 1) kept.push(compound(group));
    else kept.push(...group);
    group = [];
  };
  for (const match of folded) {
    const flagged = toStatus(match.row.vegan_status) !== "vegan";
    const last = group[group.length - 1];
    if (
      flagged &&
      last &&
      last.start + last.words.length === match.start
    ) {
      group.push(match);
      continue;
    }
    flush();
    if (flagged) group.push(match);
    else kept.push(match);
  }
  flush();

  return kept.map(({ row, words: matched }) => ({ row, words: matched }));
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
