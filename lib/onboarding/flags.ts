// First-run flags, kept in this browser only. Every read and write is
// guarded because storage can be blocked (private mode, strict settings).

export const INTRO_SEEN = "ve-intro-seen";
export const SCAN_TOUR_SEEN = "ve-tour-scan";
export const RESULTS_TOUR_SEEN = "ve-tour-results";

export function hasFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Without storage, act as if it was seen so nobody gets stuck in a loop.
    return true;
  }
}

export function setFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Nothing to do; the intro may show again next time.
  }
}

export function clearFlag(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
