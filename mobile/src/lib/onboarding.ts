import Storage from "expo-sqlite/kv-store";

// First-run flags, kept on this phone. Same names as the website used.
export const INTRO_SEEN = "ve-intro-seen";
export const SCAN_TOUR_SEEN = "ve-tour-scan";
export const RESULTS_TOUR_SEEN = "ve-tour-results";

export function hasFlag(key: string) {
  try {
    return Storage.getItemSync(key) === "1";
  } catch {
    // Without storage, act as if it was seen so nobody gets stuck in a loop.
    return true;
  }
}

export function setFlag(key: string) {
  try {
    Storage.setItemSync(key, "1");
  } catch {
    // The intro may show again next time.
  }
}

export function clearFlag(key: string) {
  try {
    Storage.removeItemSync(key);
  } catch {
    // Ignore.
  }
}
