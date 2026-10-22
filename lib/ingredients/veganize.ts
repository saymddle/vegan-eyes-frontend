import {
  matchLine,
  normalize,
  splitIngredients,
  toStatus,
  type IngredientIndex,
  type IngredientRow,
  type Status
} from "./matcher";
import { parseQuantity, RECIPE_RULES, SIZE_WORDS } from "./recipeSwaps";

export type RecipeSwap = {
  ingredient: string;
  status: Exclude<Status, "vegan">;
  // What goes into the recipe in its place. Missing when there is no swap on
  // file, or the item only needs a label check ("sugar").
  replacement?: string;
  alternative?: string;
  note?: string;
  // Why it isn't vegan, from the database ("Milk cheese").
  about?: string;
  complex?: boolean;
  // The cook chose to keep the original ingredient.
  kept?: boolean;
};

// `original` is the matched text, kept so a swap can be undone.
// `keepWord` marks a swap shown in front of the word it describes:
// "the cutlet" became "the seitan cutlet".
export type LinePart = {
  text: string;
  swap?: number;
  original?: string;
  keepWord?: boolean;
  // Swapped inside a title-case line, so any pick is shown in title case.
  titleCase?: boolean;
};

export type RecipeLine = {
  kind: "heading" | "ingredient" | "step";
  original: string;
  vegan: string;
  // The vegan line split so the swapped words can be highlighted.
  parts: LinePart[];
};

export type VeganizedRecipe = {
  title: string | null;
  status: Status;
  lines: RecipeLine[];
  swaps: RecipeSwap[];
};

const HEADING =
  /^(ingredients?|instructions?|directions?|method|steps?|preparation|notes?|for the [a-z ]+)\s*:?$/i;
const STEP_HEADING = /^(instructions?|directions?|method|steps?|preparation)\s*:?$/i;
// Sub-section labels inside a recipe: "Seasoning:", "Garnish, optional:".
const SECTION_LABEL = /^[^.!?]{1,40}:$/;
const MAX_INGREDIENT_WORDS = 12;
// "4 chicken breasts, 150-180g each (Note 1)" is an ingredient however long.
const STARTS_WITH_AMOUNT = /^(?:\d|[½¼¾⅓⅔⅛])/;
// Buttons and toggles that come along when a recipe is copied from a website.
const SITE_JUNK =
  /^(cook mode|prevent (your )?screen from (sleeping|going dark)|print( recipe)?|pin( recipe)?|jump to recipe|save recipe|rate this recipe|video)$/i;

// OCR returns markdown and recipe sites add checkboxes, so drop list
// bullets, checkboxes, table pipes and heading marks before deciding what a
// line is.
function stripMarkdown(line: string) {
  return line
    .replace(/^\s*#+\s*/, "")
    .replace(/^\s*(?:[-*•▢☐□◻■▪✓✔]|\[[ xX]?\])\s*/, "")
    .replace(/\|/g, " ")
    .replace(/\*\*|__/g, "")
    .trim();
}

// The recipe's name on its first line: "Chicken Parmesan Cutlet".
function looksLikeTitle(raw: string) {
  const line = stripMarkdown(raw);
  return (
    !/[,.;]/.test(line) &&
    !/^\s*#/.test(raw) &&
    !HEADING.test(line) &&
    !STARTS_WITH_AMOUNT.test(line) &&
    line.split(/\s+/).length <= 10
  );
}

// The name of a finished dish, which is not an ingredient. Returns that
// first line when the text is a whole recipe (it has an "Ingredients" or
// "Directions" heading), so the ingredient check can leave it out.
export function dishNameLine(text: string): string | null {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /[a-zA-Z0-9]/.test(line));
  if (lines.length < 2) return null;
  const hasSections = lines.some((line) => HEADING.test(stripMarkdown(line)));
  return hasSections && looksLikeTitle(lines[0]) ? lines[0] : null;
}

// The recipe without its dish name, for the ingredient check: "Chicken
// Parmesan Cutlet" is the finished dish, not something to buy.
export function withoutDishName(text: string) {
  const name = dishNameLine(text);
  return name ? text.replace(name, "") : text;
}

// A non-vegan dish's name becomes "Vegan Chicken Parmesan Cutlet"; the
// ingredients inside it are swapped on their own lines.
function dishTitle(name: string, index: IngredientIndex) {
  if (/\b(vegan|plant[- ]?based|dairy[- ]?free|meat[- ]?free|meatless)\b/i.test(name)) {
    return name;
  }
  const flagged = matchLine(normalize(name), index).some(
    ({ row }) => toStatus(row.vegan_status) === "non_vegan"
  );
  return flagged ? `Vegan ${name}` : name;
}

function cleanSwap(text: string | null | undefined) {
  if (!text) return undefined;
  const cleaned = text.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

// "Vegan butter" reads better mid-line as "vegan butter", but keeps its
// capital at the start of a line.
export function matchCase(replacement: string, atStart: boolean) {
  if (atStart) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  if (/^[A-Z][a-z]/.test(replacement)) {
    return replacement.charAt(0).toLowerCase() + replacement.slice(1);
  }
  return replacement;
}

function toSwap(row: IngredientRow): RecipeSwap {
  return {
    ...baseSwap(row),
    about: row.lab_note ?? undefined,
    complex: row.is_complex ?? false
  };
}

function baseSwap(row: IngredientRow): RecipeSwap {
  const status = toStatus(row.vegan_status) as RecipeSwap["status"];
  const primary = cleanSwap(row.swap_static) ?? cleanSwap(row.swap_functional);
  const alternative = cleanSwap(row.swap_static)
    ? cleanSwap(row.swap_functional)
    : undefined;

  if (status === "unclear" && !/\bvegan\b/i.test(primary ?? "")) {
    // Sugar, wine and the like are usually fine; the swap is advice on what
    // to buy, not a different ingredient.
    return {
      ingredient: row.name,
      status,
      note: primary
        ? `Look for ${primary.charAt(0).toLowerCase()}${primary.slice(1)}.`
        : "Make sure the label says it is vegan."
    };
  }

  const rule = RECIPE_RULES[normalize(row.name)];
  if (rule) {
    return {
      ingredient: row.name,
      status,
      replacement: rule.replacement,
      alternative: rule.alternative ?? alternative
    };
  }

  return {
    ingredient: row.name,
    status,
    replacement: primary,
    alternative,
    note: primary ? undefined : "No swap on file yet."
  };
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Cuts that only make sense with the meat: "2 chicken breasts" becomes
// "2 seitan or soy chicken pieces", not "... pieces breasts".
const CUTS =
  "(?:[^a-zA-Z0-9]+(?:breasts?|thighs?|fillets?|filets?|wings?|drumsticks?|tenders|tenderloins?|cutlets?|steaks?|legs?|chops?|mince))?";

// A leading amount for swaps that rewrite the quantity: "2 large eggs".
const QUANTITY = `(?:(?:\\d+(?:\\.\\d+)?|\\d+/\\d+|[½¼¾⅓⅔])\\s+(?:${SIZE_WORDS}\\s+)?)?`;

// Dairy descriptions that make no sense on the swap: "whole milk" becomes
// "unsweetened oat milk", not "whole unsweetened oat milk".
const DAIRY_WORDS =
  "(?:(?:whole|skim|skimmed|low[- ]fat|reduced[- ]fat|full[- ]fat|2%|grated|shredded|freshly grated)\\s+)?";

function phrasePattern(words: string[], withQuantity: boolean) {
  const phrase = DAIRY_WORDS + words.map(escapeRegex).join("[^a-zA-Z0-9]+") + CUTS;
  return withQuantity ? QUANTITY + phrase : phrase;
}

function ruleFor(swap: RecipeSwap) {
  return RECIPE_RULES[normalize(swap.ingredient)];
}

// "2 large eggs" becomes "2 flax eggs (...)"; without an amount the plain
// replacement is used.
function replacementText(swap: RecipeSwap, matched: string) {
  const amount = matched.match(/^([\d./½¼¾⅓⅔]+)\s/);
  const quantity = amount ? parseQuantity(amount[1]) : undefined;
  const rule = ruleFor(swap);
  if (quantity !== undefined && rule?.withQuantity) {
    return rule.withQuantity(quantity);
  }
  return (amount ? matched.slice(0, amount[0].length) : "") + swap.replacement;
}

type Phrase = {
  words: string[];
  swap: number;
  skipAtStart?: boolean;
  keepWord?: boolean;
};

const MEATS = [
  "beef", "pork", "chicken", "turkey", "lamb", "veal", "mutton", "duck",
  "goose", "venison", "bison", "sausage", "bacon", "ham", "prosciutto",
  "pancetta", "chorizo", "salami", "pepperoni", "mince", "steak", "brisket",
  "lardon", "meatball", "meatballs"
];
const FISH = [
  "fish", "cod", "salmon", "tuna", "tilapia", "halibut", "haddock", "trout",
  "snapper", "mackerel", "sardine", "anchovy", "bass", "catfish", "mahi"
];
const SHELLFISH = [
  "shrimp", "prawn", "crab", "lobster", "scallop", "mussel", "clam",
  "oyster", "squid", "calamari"
];
const CHEESES = [
  "cheese", "mozzarella", "parmesan", "parmigiano", "cheddar", "ricotta",
  "feta", "gouda", "brie", "gruyere", "gruyère", "provolone", "pecorino",
  "mascarpone", "halloumi", "burrata", "colby", "jack"
];

// Words a recipe uses for an ingredient it already listed: "Prep the meat"
// means the chicken from the list, so it shows whatever the cook picked for
// the chicken. With `keepWord` the word stays and the pick goes in front:
// "Shape the cutlet" becomes "Shape the seitan cutlet".
const GENERIC: Record<string, { kinds: string[]; keepWord?: boolean }> = {
  meat: { kinds: MEATS },
  meats: { kinds: MEATS },
  poultry: { kinds: ["chicken", "turkey", "duck", "goose"] },
  fish: { kinds: FISH },
  seafood: { kinds: [...FISH, ...SHELLFISH] },
  cheese: { kinds: CHEESES },
  cheeses: { kinds: CHEESES },
  cutlet: { kinds: [...MEATS, ...FISH], keepWord: true },
  cutlets: { kinds: [...MEATS, ...FISH], keepWord: true },
  patty: { kinds: [...MEATS, ...FISH], keepWord: true },
  patties: { kinds: [...MEATS, ...FISH], keepWord: true },
  fillet: { kinds: FISH, keepWord: true },
  fillets: { kinds: FISH, keepWord: true },
  filet: { kinds: FISH, keepWord: true },
  filets: { kinds: FISH, keepWord: true }
};

const SMALL_WORDS = new Set(["a", "an", "and", "or", "of", "the", "with", "in", "to"]);

export function toTitleCase(text: string) {
  return text.replace(/(^|[\s(/-])([a-z]+)/g, (_all, gap: string, word: string) =>
    gap && SMALL_WORDS.has(word)
      ? gap + word
      : gap + word.charAt(0).toUpperCase() + word.slice(1)
  );
}

// "Prep the Meat": a line written in title case, like a section name.
function isTitleCase(line: string) {
  const words = line.match(/[A-Za-z]{4,}/g) ?? [];
  return words.length > 0 && words.every((word) => /^[A-Z]/.test(word));
}

// Replaces every matched phrase in one pass, so a replacement ("coconut
// cream") is never matched again by a shorter phrase ("cream").
function replacePhrases(
  line: string,
  phrases: Phrase[],
  swaps: RecipeSwap[]
): LinePart[] {
  const usable = phrases
    .filter(({ swap }) => swaps[swap].replacement)
    .sort((a, b) => b.words.join(" ").length - a.words.join(" ").length);

  if (usable.length === 0) return [{ text: line }];

  // One capture group per phrase tells us which one matched.
  const pattern = new RegExp(
    `(?<![a-zA-Z0-9])(?:${usable.map(({ words, swap }) => `(${phrasePattern(words, Boolean(ruleFor(swaps[swap])?.withQuantity))})`).join("|")})(?![a-zA-Z0-9])`,
    "gi"
  );
  // Where the text starts, after any step number ("1. Cream the butter").
  const firstWord = (line.match(/^(?:\d+[.)]\s+)?/) ?? [""])[0].length;
  const titleCase = isTitleCase(line);

  const parts: LinePart[] = [];
  let last = 0;

  for (const found of line.matchAll(pattern)) {
    const start = found.index ?? 0;
    const phrase = usable[found.slice(1).findIndex((group) => group)];
    if (!phrase || (phrase.skipAtStart && start === firstWord)) continue;
    if (start > last) parts.push({ text: line.slice(last, start) });
    const capital =
      start === firstWord || (titleCase && /^[A-Z]/.test(found[0]));
    const replacement = replacementText(swaps[phrase.swap], found[0]);
    // In a title-case line ("Melt the Cheese") the swap is title case too.
    const inTitle = titleCase && /^[A-Z]/.test(found[0]);
    const swapped = inTitle
      ? toTitleCase(replacement)
      : matchCase(replacement, capital);
    parts.push({
      text: phrase.keepWord ? `${swapped} ${found[0]}` : swapped,
      swap: phrase.swap,
      original: found[0],
      ...(phrase.keepWord ? { keepWord: true } : {}),
      ...(inTitle ? { titleCase: true } : {})
    });
    last = start + found[0].length;
  }

  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts;
}

function findFlagged(text: string, index: IngredientIndex) {
  return splitIngredients(text).flatMap((segment) =>
    matchLine(segment, index).filter(
      ({ row }) => toStatus(row.vegan_status) !== "vegan"
    )
  );
}

export function veganizeRecipe(
  text: string,
  index: IngredientIndex
): VeganizedRecipe {
  const swaps: RecipeSwap[] = [];
  const swapByRow = new Map<string, number>();
  const lines: RecipeLine[] = [];
  let title: string | null = null;
  let inSteps = false;

  // Swaps first found in a step are kept only if a step actually used them,
  // so "Cream the sugar" does not list a cream swap.
  const fromSteps = new Set<number>();

  const swapFor = (row: IngredientRow, inStep = false) => {
    const key = normalize(row.name);
    let at = swapByRow.get(key);
    if (at === undefined) {
      at = swaps.push(toSwap(row)) - 1;
      swapByRow.set(key, at);
      if (inStep) fromSteps.add(at);
    }
    return at;
  };

  // "the meat" in a step means the chicken from the ingredient list.
  const genericSwap = (name: string) => {
    const generic = GENERIC[name];
    if (!generic) return undefined;
    for (const [listed, at] of swapByRow) {
      if (fromSteps.has(at) || !swaps[at].replacement) continue;
      if (listed.split(" ").some((word) => generic.kinds.includes(word))) {
        return { swap: at, keepWord: generic.keepWord };
      }
    }
    return undefined;
  };

  // A match in a step, as phrases to swap: the ingredient-list swap it
  // refers to, so the step shows whatever the cook picked.
  const stepPhrases = (
    name: string,
    words: string[]
  ): Phrase[] | undefined => {
    const listed = stepSwap(name);
    if (listed !== undefined) return [{ words, swap: listed, skipAtStart: true }];
    const generic = genericSwap(name);
    if (generic) return [{ words, ...generic, skipAtStart: true }];
    return undefined;
  };

  // "cream" in a step means the "heavy cream" from the ingredient list.
  const stepSwap = (name: string) => {
    const exact = swapByRow.get(name);
    if (exact !== undefined) return exact;
    for (const [swapped, at] of swapByRow) {
      if (swapped.endsWith(` ${name}`)) return at;
    }
    return undefined;
  };

  const rawLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /[a-zA-Z0-9]/.test(line));
  const total = rawLines.length;

  rawLines.forEach((raw, at) => {
      const line = stripMarkdown(raw);
      const isMarkdownHeading = /^\s*#/.test(raw);
      if (SITE_JUNK.test(line)) return;

      // A pasted recipe often starts with its name and no markdown.
      if (at === 0 && total > 1 && looksLikeTitle(raw)) {
        title = dishTitle(line, index);
        lines.push({ kind: "heading", original: line, vegan: title, parts: [{ text: title }] });
        return;
      }

      if (isMarkdownHeading || HEADING.test(line) || (!inSteps && SECTION_LABEL.test(line))) {
        if (STEP_HEADING.test(line)) inSteps = true;
        else if (/^ingredients?\s*:?$/i.test(line)) inSteps = false;
        if (!title && isMarkdownHeading && !HEADING.test(line)) {
          title = dishTitle(line, index);
          lines.push({ kind: "heading", original: line, vegan: title, parts: [{ text: title }] });
          return;
        }
        // A section name such as "## Prep the Meat" shows the cook's pick
        // for what it names, but never adds a swap of its own.
        const named = HEADING.test(line)
          ? []
          : findFlagged(line, index).flatMap(
              ({ row, words, parts }) =>
                stepPhrases(normalize(row.name), words) ??
                (parts ?? []).flatMap(
                  (part) => stepPhrases(normalize(part.row.name), part.words) ?? []
                )
            );
        const headingParts = replacePhrases(line, named, swaps);
        lines.push({
          kind: "heading",
          original: line,
          vegan: headingParts.map((part) => part.text).join(""),
          parts: headingParts
        });
        return;
      }

      const wordCount = line.split(/\s+/).length;
      const kind =
        inSteps ||
        (wordCount > MAX_INGREDIENT_WORDS && !STARTS_WITH_AMOUNT.test(line))
          ? "step"
          : "ingredient";

      const matches = findFlagged(line, index).flatMap(({ row, words, parts }): Phrase[] => {
        if (kind === "ingredient") return [{ words, swap: swapFor(row) }];
        // A step's first word is usually a verb ("Cream", "Butter"), so it is
        // never swapped. "cream" in a step means the "heavy cream" from the
        // ingredient list; anything non-vegan the list missed is swapped too,
        // wherever it appears.
        const whole = stepPhrases(normalize(row.name), words);
        if (whole) return whole;
        // "Build the Chicken Parmesan": swap the parts the list swapped
        // ("chicken" as the cook's pick) and leave the rest as written.
        const fromParts = (parts ?? []).flatMap(
          (part) => stepPhrases(normalize(part.row.name), part.words) ?? []
        );
        if (fromParts.length) return fromParts;
        return toStatus(row.vegan_status) === "non_vegan"
          ? [{ words, swap: swapFor(row, true), skipAtStart: true }]
          : [];
      });

      const parts = replacePhrases(line, matches, swaps);
      lines.push({
        kind,
        original: line,
        vegan: parts.map((part) => part.text).join(""),
        parts
      });
    });

  const used = new Set(
    lines.flatMap((line) => line.parts.map((part) => part.swap))
  );
  const keep = swaps.map((_, at) => !fromSteps.has(at) || used.has(at));
  const newIndex = keep.map((_, at) => keep.slice(0, at).filter(Boolean).length);
  lines.forEach((line) =>
    line.parts.forEach((part) => {
      if (part.swap !== undefined) part.swap = newIndex[part.swap];
    })
  );
  swaps.splice(0, swaps.length, ...swaps.filter((_, at) => keep[at]));

  const status: Status = swaps.some((swap) => swap.status === "non_vegan")
    ? "non_vegan"
    : swaps.length
      ? "unclear"
      : "vegan";

  return { title, status, lines, swaps };
}
