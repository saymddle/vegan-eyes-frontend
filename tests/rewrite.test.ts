import { describe, expect, it } from "vitest";
import {
  acceptStep,
  applyRewrite,
  isReasonableRequest,
  rewriteMessages,
  rewriteRequest
} from "@/lib/ingredients/rewrite";
import { applySwapChoices } from "@/lib/ingredients/swapChoices";
import { convert, index, readRecipe } from "./helpers";

const alfredo = convert(readRecipe("06-ocr-markdown.txt"));
const request = rewriteRequest(alfredo)!;

describe("what is sent for rewording", () => {
  it("sends the vegan steps and the swaps", () => {
    expect(request.steps).toHaveLength(3);
    expect(request.steps[0]).toContain("seitan");
    expect(request.swaps).toContainEqual({
      from: "Heavy Cream",
      to: "full-fat coconut cream"
    });
    expect(request.ingredients.join("\n")).toContain("2 seitan cutlets");
  });

  it("asks for one step per step", () => {
    const user = rewriteMessages(request)[1].content;
    expect(user).toContain("Steps (3):");
    expect(user).toContain("- Heavy Cream -> full-fat coconut cream");
  });

  it("sends nothing when there are no steps", () => {
    expect(rewriteRequest(convert(readRecipe("01-pancakes.txt")))).toBeNull();
  });

  it("sends nothing when every swap is kept as the original", () => {
    const keepAll = Object.fromEntries(
      alfredo.swaps.map((_, at) => [at, "original" as const])
    );
    expect(rewriteRequest(applySwapChoices(alfredo, keepAll))).toBeNull();
  });

  it("turns away oversized requests", () => {
    expect(
      isReasonableRequest({ ...request, steps: Array(41).fill("Stir.") })
    ).toBe(false);
    expect(isReasonableRequest({ ...request, steps: ["x".repeat(9000)] })).toBe(
      false
    );
  });
});

describe("the database checks each reworded step", () => {
  const plain =
    "Melt the vegan butter, add the full-fat coconut cream and simmer for 5 minutes.";

  it("keeps a sensible rewording", () => {
    const better =
      "Melt the vegan butter over medium-low heat, add the full-fat coconut cream and simmer gently for 5 minutes so it doesn't split.";
    expect(acceptStep(plain, better, index)).toBe(better);
  });

  it("rejects a step that brings back an animal ingredient", () => {
    expect(
      acceptStep(
        plain,
        "Melt the butter, add the heavy cream and simmer.",
        index
      )
    ).toBeNull();
  });

  it("allows animal words the cook chose to keep", () => {
    const kept = "Melt the butter and simmer for 5 minutes.";
    expect(
      acceptStep(
        kept,
        "Melt the butter gently and simmer for 5 minutes.",
        index
      )
    ).not.toBeNull();
  });

  it("keeps the step's number", () => {
    expect(
      acceptStep(
        "2. Melt the vegan butter.",
        "Melt the vegan butter gently.",
        index
      )
    ).toBe("2. Melt the vegan butter gently.");
  });

  it("rejects empty, unchanged, non-text and runaway answers", () => {
    expect(acceptStep(plain, "", index)).toBeNull();
    expect(acceptStep(plain, plain, index)).toBeNull();
    expect(acceptStep(plain, 42, index)).toBeNull();
    expect(
      acceptStep(plain, plain + " ".repeat(2) + "x".repeat(400), index)
    ).toBeNull();
  });
});

describe("reworded steps in the recipe", () => {
  const steps = [
    "Press the seitan cutlets dry, season and sear until golden, then slice.",
    null,
    "Stir in the vegan parmesan off the heat, then toss with the fettuccine and seitan."
  ];
  const result = applyRewrite(alfredo, steps);
  const stepLines = result.lines.filter((line) => line.kind === "step");

  it("replaces only the reworded steps", () => {
    expect(stepLines[0].vegan).toBe(steps[0]);
    expect(stepLines[1].vegan).toBe(
      alfredo.lines.filter((line) => line.kind === "step")[1].vegan
    );
    expect(result.lines.filter((line) => line.kind === "ingredient")).toEqual(
      alfredo.lines.filter((line) => line.kind === "ingredient")
    );
  });

  it("still highlights the swapped words", () => {
    const swapped = stepLines[0].parts.filter(
      (part) => part.swap !== undefined
    );
    expect(swapped.map((part) => part.text)).toEqual(["seitan"]);
    expect(stepLines[0].parts.map((part) => part.text).join("")).toBe(steps[0]);
  });
});
