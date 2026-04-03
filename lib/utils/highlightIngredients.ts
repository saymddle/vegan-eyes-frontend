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
  let result = escapeHtml(text);

  ingredients.forEach((item) => {
    const style =
      item.status === "not_vegan"
        ? `background-color:${colors.alert};color:${colors.white};`
        : item.status === "maybe"
          ? `background-color:${colors.secondary};color:${colors.black};`
          : "";

    if (!style || !item.name.trim()) {
      return;
    }

    const regex = new RegExp(`\\b(${escapeRegExp(escapeHtml(item.name))})\\b`, "gi");

    result = result.replace(
      regex,
      `<span data-ingredient="${escapeHtml(item.name)}" class="inline-block px-1 font-bold cursor-pointer underline transition-all duration-200 ease-out ${
        focusedIngredient === item.name
          ? "ring-2 ring-[#000000] scale-105 opacity-100"
          : "opacity-80"
      }" style="${style}">$1</span>`
    );
  });

  return result;
}
