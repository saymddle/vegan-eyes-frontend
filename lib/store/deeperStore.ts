export type DeeperItem = {
  id: string;
  ingredient: string;
  reason: string;
  substitutes: string[];
  created_at: string;
};

const STORAGE_KEY = "deeper";

function normalizeIngredientName(value: string) {
  return value.trim().toLowerCase();
}

export function getDeeperItems(): DeeperItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as DeeperItem[];
  } catch {
    return [];
  }
}

export function saveDeeper(item: Omit<DeeperItem, "id" | "created_at">) {
  const existing = getDeeperItems();
  const alreadySaved = existing.some(
    (entry) =>
      normalizeIngredientName(entry.ingredient) ===
        normalizeIngredientName(item.ingredient) &&
      entry.reason.trim().toLowerCase() === item.reason.trim().toLowerCase()
  );

  if (alreadySaved) {
    return;
  }

  const updated: DeeperItem[] = [
    {
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    },
    ...existing
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
