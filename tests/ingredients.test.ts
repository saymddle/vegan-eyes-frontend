import { describe, expect, it } from "vitest";
import { NON_VEGAN, VEGAN } from "./fixtures/ingredientLists";
import { splitList, statusOf } from "./helpers";

// Known misses. Each one runs as an expected failure, so when a fix lands
// the test turns red and says to move the item out of this list.
const NOT_CAUGHT_YET = new Set<string>([]);

const WRONGLY_FLAGGED_YET = new Set<string>([]);

describe("non-vegan ingredients are flagged", () => {
  for (const item of splitList(NON_VEGAN)) {
    const run = NOT_CAUGHT_YET.has(item) ? it.fails : it;
    run(item, () => {
      expect(statusOf(item)).not.toBe("vegan");
    });
  }
});

describe("vegan ingredients are not flagged as non-vegan", () => {
  for (const item of splitList(VEGAN)) {
    const run = WRONGLY_FLAGGED_YET.has(item) ? it.fails : it;
    run(item, () => {
      expect(statusOf(item)).not.toBe("non_vegan");
    });
  }
});
