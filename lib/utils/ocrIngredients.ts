export type Ingredient = {
  quantity?: number;
  unit?: string;
  name: string;
  notes?: string;
  confidence: "high" | "medium" | "low";
};

const UNITS = [
  "tsp",
  "teaspoon",
  "tbsp",
  "tablespoon",
  "cup",
  "cups",
  "oz",
  "g",
  "kg",
  "ml",
  "l"
];

export function normalizeOCR(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.match(/^[^a-zA-Z0-9]+$/));
}

function parseFraction(value: string): number | null {
  if (value.includes("/")) {
    const [a, b] = value.split("/").map(Number);
    return a && b ? a / b : null;
  }
  return null;
}

export function parseIngredient(line: string): Ingredient {
  const original = line;
  const parts = line.split(" ");

  let quantity: number | undefined;
  let unit: string | undefined;

  const fraction = parseFraction(parts[0]);
  if (fraction) {
    quantity = fraction;
    parts.shift();
  } else if (!Number.isNaN(Number(parts[0]))) {
    quantity = Number(parts.shift());
  }

  if (parts.length && UNITS.includes(parts[0].toLowerCase())) {
    unit = parts.shift();
  }

  const name = parts.join(" ");

  return {
    quantity,
    unit,
    name: name || original,
    confidence: quantity && unit ? "high" : quantity ? "medium" : "low"
  };
}

export function processOCRIngredients(text: string): Ingredient[] {
  const lines = normalizeOCR(text);
  return lines.map(parseIngredient);
}
