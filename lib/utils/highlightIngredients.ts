import { colors } from "@/lib/theme/colors";

type HighlightableIngredient = {
  name: string;
  status: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getIngredientAnchorId(name: string) {
  return `ingredient-${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export function highlightIngredients(
  text: string,
  ingredients: HighlightableIngredient[],
  focusedIngredient: string | null = null
) {
  const styles = new Map<string, { name: string; style: string }>();
  for (const item of ingredients) {
    const style =
      item.status === "not_vegan"
        ? `background-color:${colors.alert};color:${colors.white};`
        : item.status === "maybe"
          ? `background-color:${colors.secondary};color:${colors.black};`
          : "";
    if (!style || !item.name.trim()) continue;
    styles.set(item.name.toLowerCase(), { name: item.name, style });
  }

  const escaped = escapeHtml(text);
  if (!styles.size) return escaped;

  // One pass, longest name first, so "Chicken Parmesan Cutlet" is one
  // highlight and "Chicken" isn't highlighted again inside it.
  const names = [...styles.values()]
    .map((entry) => escapeRegExp(escapeHtml(entry.name)))
    .sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${names.join("|")})\\b`, "gi");

  return escaped.replace(regex, (found: string) => {
    const entry = [...styles.values()].find(
      (value) => escapeHtml(value.name).toLowerCase() === found.toLowerCase()
    );
    if (!entry) return found;
    return `<span data-ingredient="${escapeHtml(entry.name)}" class="inline-block px-1 font-bold cursor-pointer underline transition-all duration-200 ease-out ${
      focusedIngredient === entry.name ? "ring-2 ring-[#000000] scale-105" : ""
    }" style="${entry.style}">${found}</span>`;
  });
}
