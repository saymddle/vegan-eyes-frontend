import type { UIResult } from "@/lib/types/result";

export type SavedScan = {
  id: string;
  input: string;
  result: UIResult;
  timestamp: string;
};

export function deriveRecipeTitle(input: string) {
  const words = input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return words.slice(0, 2).join(" + ") || "Saved Recipe";
}
