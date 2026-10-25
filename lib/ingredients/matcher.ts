import type { BackendIngredient } from "../types/check";

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

const LIGATURES: Record<string, string> = { "œ": "oe", "æ": "ae", "ß": "ss" };

// "Pâté" and "pate" are the same word to the matcher.
export function foldAccents(text: string) {
  return text
    .replace(/[œæß]/gi, (letter) => LIGATURES[letter.toLowerCase()] ?? letter)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalize(text: string) {
  return foldAccents(text.toLowerCase())
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const ACCENTED: Record<string, string> = {
  a: "aàáâãäå",
  c: "cç",
  e: "eèéêë",
  i: "iìíîï",
  n: "nñ",
  o: "oòóôõöø",
  u: "uùúûü",
  y: "yýÿ"
};

// A regex for a normalized word that also finds it written with accents, so
// "pate" finds "pâté" in the original text.
export function loosePattern(word: string) {
  return [...word]
    .map((letter) =>
      ACCENTED[letter]
        ? `[${ACCENTED[letter]}]`
        : letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("");
}

// Letters, digits and accented letters: what counts as "inside a word".
export const WORD_CHAR = "a-zA-Z0-9\\u00C0-\\u024F";

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
  const detail = richness(next) - richness(current);
  if (detail !== 0) return detail > 0 ? next : current;
  // "Crème Fraîche" and "Creme Fraiche": keep the proper spelling.
  const accents = (row: IngredientRow) => (/[^\x00-\x7f]/.test(row.name) ? 1 : 0);
  return accents(next) > accents(current) ? next : current;
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
  "cup", "cups", "oz", "g", "kg", "ml", "l", "lb", "lbs", "pinch"
]);

// The words that name the ingredient: no amounts or units, and no "of" right
// after them ("1 cup of milk"), but "cream of coconut" keeps its "of".
function nameWords(words: string[]) {
  return words.filter((word, at) => {
    if (/^\d+$/.test(word) || QUANTITY_WORDS.has(word)) return false;
    const before = words[at - 1] ?? "";
    return !(word === "of" && (/^\d+$/.test(before) || QUANTITY_WORDS.has(before)));
  });
}

function singular(word: string) {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (/(ses|xes|ches|shes|oes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

// Words that mark the next ingredient as already plant-based: "vegan butter",
// "plant-based milk", "dairy-free cheese". Brands that only sell plant-based
// food count too ("Violife feta", "Just Egg").
const VEGAN_MARKERS = [
  "vegan", "plant based", "plantbased", "dairy free", "non dairy", "nondairy",
  "egg free", "eggless", "meat free", "meatless", "faux", "mock",
  "violife", "daiya", "miyoko s", "miyokos", "earth balance", "field roast",
  "gardein", "tofurky", "kite hill", "follow your heart", "oatly",
  "vegenaise", "tofutti", "lightlife", "just egg", "beyond meat",
  "beyond burger", "beyond sausage", "impossible burger", "impossible meat",
  "impossible sausage"
].map((marker) => marker.split(" "));

// "Vegetarian oyster sauce" has no oyster, but vegetarian cheese still has
// milk, so these only clear meat and fish.
const MEAT_FREE_MARKERS = ["vegetarian", "veggie"];
const MEAT_AND_FISH = new Set([
  "meat", "beef", "pork", "chicken", "turkey", "lamb", "duck", "bacon", "ham",
  "sausage", "sausages", "burger", "burgers", "mince", "meatball", "meatballs",
  "fish", "oyster", "anchovy", "anchovies", "shrimp", "prawn", "prawns",
  "crab", "tuna", "salmon", "worcestershire", "chorizo", "pepperoni",
  "nuggets", "broth", "stock", "bouillon", "gelatin", "jerky"
]);

// Said after the ingredient: "egg-free", "fish sauce substitute".
const AFTER_MARKERS = new Set([
  "free", "substitute", "substitutes", "replacer", "replacement",
  "alternative", "alternatives"
]);

// Said at the very end of a line about everything on it:
// "butterscotch chips (dairy-free)", "chicken-style bouillon (vegan)".
const LINE_END_MARKERS = [
  "vegan", "plant based", "dairy free", "egg free", "non dairy"
];

// Words that may sit between a marker and the ingredient it marks:
// "plant-based ground beef", "vegan pulled pork".
const DESCRIPTIONS = new Set([
  "ground", "pulled", "shredded", "smoked", "crumbled", "sliced", "style",
  "sharp", "aged", "grated", "salted", "unsalted", "melted", "softened",
  "whole", "large", "small", "chopped", "diced", "fresh", "cold", "frozen",
  "shreds", "block", "original", "unsweetened", "plain", "greek"
]);

// Plant foods that make a plant version of a dairy food: "cashew ricotta",
// "oat cream", "coconut milk yogurt".
const DAIRY_FOODS = new Set([
  "milk", "cream", "creamer", "yogurt", "yoghurt", "butter", "cheese",
  "ricotta", "mozzarella", "feta", "parmesan", "cheddar", "queso", "alfredo",
  "mayo", "mayonnaise", "ice"
]);
const DAIRY_BASES = new Set([
  "almond", "cashew", "oat", "soy", "coconut", "rice", "hemp", "pea",
  "macadamia", "pistachio", "hazelnut", "walnut", "tofu", "aquafaba",
  "sunflower", "flax"
]);

// Plant foods that make a plant version of a meat: "seitan bacon", "carrot
// lox", "jackfruit pulled pork". Each meat lists what it is made from, so
// "mushroom chicken" (a dish with chicken) stays flagged.
const PROTEINS = ["seitan", "tempeh", "tofu", "soy", "tvp"];
// "Soy chicken" is usually soy-glazed chicken, so soy only counts where it
// makes the meat itself ("soy chorizo").
const MEAT_PROTEINS = ["seitan", "tempeh", "tofu", "tvp"];
const PLANT_MEATS: Record<string, string[]> = {
  bacon: [...PROTEINS, "mushroom", "mushrooms", "shiitake", "eggplant", "carrot", "coconut", "beet", "paper"],
  jerky: [...PROTEINS, "mushroom", "mushrooms", "shiitake", "eggplant", "carrot", "coconut", "beet"],
  lox: ["carrot", "beet"],
  burger: [...PROTEINS, "jackfruit", "lentil", "chickpea", "bean", "beet"],
  meatball: [...PROTEINS, "lentil", "chickpea", "mushroom", "bean", "eggplant"],
  sausage: [...PROTEINS, "lentil", "chickpea"],
  chorizo: [...PROTEINS, "lentil", "chickpea"],
  mince: [...PROTEINS, "lentil", "mushroom"],
  crumbles: [...PROTEINS],
  nuggets: [...PROTEINS, "chickpea", "cauliflower"],
  steak: [...MEAT_PROTEINS, "cauliflower"],
  ribs: [...MEAT_PROTEINS, "jackfruit"],
  rib: [...MEAT_PROTEINS, "jackfruit"],
  tuna: ["chickpea", "watermelon"],
  scallop: ["mushroom"],
  pork: [...MEAT_PROTEINS, "jackfruit"],
  chicken: [...MEAT_PROTEINS, "jackfruit"],
  beef: [...MEAT_PROTEINS, "jackfruit"],
  ham: [...MEAT_PROTEINS],
  turkey: [...MEAT_PROTEINS],
  oyster: ["mushroom", "mushrooms", "shiitake"]
};

// Where the plant version starts ("cashew" in "cashew ricotta"), or
// undefined when the words are not a plant version of the food.
function plantVersion(words: string[], start: number, size: number) {
  let before = start - 1;
  while (before >= 0 && DESCRIPTIONS.has(words[before])) before--;
  if (before < 0) return undefined;
  const base = words[before];
  const matched = words.slice(start, start + size).map(singular);
  if (matched.some((word) => DAIRY_FOODS.has(word))) {
    if (DAIRY_BASES.has(base)) return before;
    // "coconut milk yogurt"
    if ((base === "milk" || base === "cream") && DAIRY_BASES.has(words[before - 1] ?? "")) {
      return before - 1;
    }
  }
  const meat = matched.some((word) => {
    const bases = PLANT_MEATS[word];
    return bases ? bases.includes(base) || bases.includes(singular(base)) : false;
  });
  return meat ? before : undefined;
}

function isTerm(index: IngredientIndex, word: string) {
  return Boolean(lookup(index.terms, [word]));
}

function startsWith(words: string[], from: number, marker: string[]) {
  return from >= 0 && marker.every((word, at) => words[from + at] === word);
}

// Where the plant-based marking starts, or undefined when the ingredient at
// start..end is not marked as plant-based.
function markedVegan(
  words: string[],
  start: number,
  end: number,
  index: IngredientIndex
): number | undefined {
  if (AFTER_MARKERS.has(words[end] ?? "")) return start;
  const plant = plantVersion(words, start, end - start);
  if (plant !== undefined) return plant;

  const lineEnd = (count: number) => words.slice(-count).join(" ");
  if (LINE_END_MARKERS.some((marker) => lineEnd(marker.split(" ").length) === marker)) {
    return start;
  }

  // Up to two plain words may come between the marker and the ingredient,
  // as long as they aren't ingredients themselves ("vegan butter, eggs").
  let gap = start;
  for (let skipped = 0; skipped <= 2; skipped++) {
    for (const marker of VEGAN_MARKERS) {
      if (startsWith(words, gap - marker.length, marker)) return gap - marker.length;
    }
    if (MEAT_FREE_MARKERS.includes(words[gap - 1] ?? "")) {
      return words.slice(start, end).some((word) => MEAT_AND_FISH.has(word))
        ? gap - 1
        : undefined;
    }
    const filler = words[gap - 1];
    if (!filler || STOP_WORDS.has(filler)) break;
    if (!DESCRIPTIONS.has(filler) && isTerm(index, filler)) break;
    gap--;
  }

  // A brand name that runs into the ingredient: "Just Egg", "Field Roast
  // sausage" (where "roast sausage" is the match).
  for (const marker of VEGAN_MARKERS) {
    for (let from = Math.max(0, start - marker.length + 1); from < start; from++) {
      if (startsWith(words, from, marker)) return from;
    }
  }
  return undefined;
}

const STOP_WORDS = new Set(["and", "or", "with", "plus", "of", "for", "to", "the"]);

// Food words that are something else next to certain words: a beef tomato,
// fish-shaped crackers, ribs of celery, artichoke hearts, kidney beans.
function notTheFood(words: string[], start: number, size: number) {
  if (size !== 1) return false;
  const word = words[start];
  const next = words[start + 1] ?? "";
  const after = words[start + 2] ?? "";
  const prev = words[start - 1] ?? "";
  switch (singular(word)) {
    case "beef":
      return next === "tomato" || next === "tomatoes";
    case "fish":
      return next === "shaped";
    case "rib":
      return words.includes("celery");
    case "heart":
      return (
        ["artichoke", "romaine", "celery", "lettuce", "palm", "cabbage", "hemp"].includes(prev) ||
        (next === "of" && ["palm", "romaine", "celery", "lettuce"].includes(after)) ||
        next === "healthy"
      );
    case "kidney":
      return next === "bean" || next === "beans";
    default:
      return false;
  }
}

// Ingredients made from an animal that the database lists only as a tag on
// the animal ("chicken stock" on Chicken). Swapping them for the animal's
// swap would give "1 cup seitan", so they get a swap of their own.
const MADE_FROM: Record<string, string> = {
  broth: "Vegetable broth",
  stock: "Vegetable stock",
  bouillon: "Vegetable bouillon",
  fat: "Coconut oil or vegetable shortening",
  grease: "Coconut oil or vegetable shortening",
  drippings: "Olive oil",
  extract: "Yeast extract"
};

function madeFromSwap(words: string[]) {
  const last = words[words.length - 1];
  const swap = MADE_FROM[last];
  if (!swap) return undefined;
  // Beef stock is darker and richer than vegetable stock.
  if (words.includes("beef") && (last === "broth" || last === "stock")) {
    return `Mushroom ${last}`;
  }
  return swap;
}

function madeFrom(row: IngredientRow, words: string[]): IngredientRow | undefined {
  const own = normalize(row.name).split(" ");
  if (words.length <= own.length) return undefined;
  if (!own.every((word) => words.includes(word))) return undefined;
  const swap = madeFromSwap(words);
  if (!swap) return undefined;
  return {
    name: titleCase(words),
    vegan_status: row.vegan_status,
    lab_note: `Made with ${row.name.toLowerCase()}.`,
    swap_static: toStatus(row.vegan_status) === "vegan" ? null : swap,
    swap_functional: null,
    is_complex: false,
    aliases: null
  };
}

function titleCase(words: string[]) {
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    swap_static:
      status === "non_vegan" ? (madeFromSwap(words) ?? `Vegan ${phrase}`) : null,
    swap_functional: null,
    is_complex: true,
    aliases: null
  };
  return {
    row,
    words,
    start: parts[0].start,
    parts: parts.map((part) => ({ row: part.row, words: part.words }))
  };
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
  const lastSingular =
    single === last ? undefined : map.get([...words.slice(0, -1), single].join(" "));
  if (lastSingular || words.length === 1) return lastSingular;
  // "hearts of palm" finds "heart of palm".
  const first = singular(words[0]);
  return first === words[0]
    ? undefined
    : map.get([first, ...words.slice(1)].join(" "));
}

export type LineMatch = {
  row: IngredientRow;
  // The normalized words of the line that matched, e.g. ["heavy", "cream"].
  words: string[];
  // For a name joined from neighbouring words ("chicken parmesan"), the
  // matches it was made from.
  parts?: LineMatch[];
};

// Finds the database rows mentioned in one ingredient line, longest phrase
// first, so "soy lecithin" wins over "lecithin".
export function matchLine(line: string, index: IngredientIndex): LineMatch[] {
  return scanLine(line, index).matches;
}

// Phrases on the line that are already plant-based ("flax eggs", "vegan
// butter", "cashew ricotta"), so a swap for "eggs" or "butter" elsewhere in
// the recipe leaves them alone.
export function plantPhrases(line: string, index: IngredientIndex): string[][] {
  const { matches, safe } = scanLine(line, index);
  return [
    ...safe,
    ...matches
      .filter(({ row, words }) => words.length > 1 && toStatus(row.vegan_status) === "vegan")
      .map(({ words }) => words)
  ];
}

function scanLine(
  line: string,
  index: IngredientIndex
): { matches: LineMatch[]; safe: string[][] } {
  const words = line.split(" ");
  const named = nameWords(words);

  const whole = named.length ? lookup(index.exact, named) : undefined;
  if (whole) {
    const row = index.terms.has(named.join(" ")) ? whole : (madeFrom(whole, named) ?? whole);
    return { matches: [{ row, words: named }], safe: [] };
  }

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
      if (usedAsVerb(words, start, size) || notTheFood(words, start, size)) {
        used.fill(true, start, start + size);
        continue;
      }
      // Skip "butter" in "vegan butter", but keep the words used so a
      // shorter phrase inside it is not matched either.
      const from = markedVegan(words, start, start + size, index);
      if (from !== undefined) {
        const end =
          start + size + (AFTER_MARKERS.has(words[start + size] ?? "") ? 1 : 0);
        used.fill(true, start, end);
        veganSpans.push({ start: from, end });
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

  return {
    matches: kept.map(({ row, words: matched, parts }) =>
      parts ? { row, words: matched, parts } : { row, words: matched }
    ),
    safe: veganSpans.map(({ start, end }) => words.slice(start, end))
  };
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
