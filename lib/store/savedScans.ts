import type { UIResult } from "@/lib/types/result";

const STORAGE_KEY = "vegan-eyes:history";
const LEGACY_STORAGE_KEY = "scans";
const MAX_SCANS = 50;

export type SavedScan = {
  id: string;
  input: string;
  result: UIResult;
  timestamp: string;
};

type LegacySavedScan = SavedScan & {
  createdAt?: string;
};

function normalizeScan(scan: LegacySavedScan): SavedScan {
  return {
    id: scan.id || crypto.randomUUID(),
    input: scan.input || "",
    result: scan.result,
    timestamp: scan.timestamp || scan.createdAt || new Date().toISOString()
  };
}

export function deriveRecipeTitle(input: string) {
  const words = input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return words.slice(0, 2).join(" + ") || "Saved Recipe";
}

function persistScans(scans: SavedScan[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(scans));
}

export function getScans(): SavedScan[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ||
      "[]";
    const parsed = JSON.parse(raw) as LegacySavedScan[];

    return parsed.map(normalizeScan);
  } catch {
    return [];
  }
}

export function getScanById(id: string) {
  return getScans().find((scan) => scan.id === id) || null;
}

export function saveScan(input: string, result: UIResult): SavedScan {
  const nextEntry: SavedScan = {
    id: crypto.randomUUID(),
    input,
    result,
    timestamp: new Date().toISOString()
  };

  const nextScans = [nextEntry, ...getScans()].slice(0, MAX_SCANS);
  persistScans(nextScans);

  return nextEntry;
}

export function deleteScan(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  const nextScans = getScans().filter((scan) => scan.id !== id);
  persistScans(nextScans);
}
