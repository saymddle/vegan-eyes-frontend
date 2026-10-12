"use client";

import { useEffect, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import { RECIPE_STORAGE_KEY } from "@/lib/store/recipeInput";
import { colors } from "@/lib/theme/colors";

const statusCopy = {
  vegan: {
    variant: "vegan",
    title: "Already vegan",
    body: "Nothing in this recipe needs swapping."
  },
  non_vegan: {
    variant: "vegan",
    title: "Vegan version",
    body: "The swapped ingredients are highlighted below."
  },
  unclear: {
    variant: "maybe",
    title: "Nearly vegan",
    body: "A few ingredients need a quick label check."
  }
} as const;

export default function ConvertPage() {
  const [source, setSource] = useState("");
  const [recipe, setRecipe] = useState<VeganizedRecipe | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function convert() {
      const stored = sessionStorage.getItem(RECIPE_STORAGE_KEY) || "";
      setSource(stored);

      if (!stored.trim()) {
        setError("No recipe found. Go back and scan or paste one.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/veganize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: stored })
        });

        if (!res.ok) {
          throw new Error("Could not convert this recipe right now.");
        }

        const data = (await res.json()) as VeganizedRecipe;
        if (isActive) setRecipe(data);
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not convert this recipe right now."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void convert();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleCopy() {
    if (!recipe) return;

    const text = recipe.lines
      .map((line) => (line.kind === "heading" ? `\n${line.vegan}` : line.vegan))
      .join("\n")
      .trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the text and copy it instead.");
    }
  }

  const summary = recipe ? statusCopy[recipe.status] : null;
  const replaced = recipe?.swaps.filter((swap) => swap.replacement) ?? [];
  const toCheck = recipe?.swaps.filter((swap) => !swap.replacement) ?? [];

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow
          title={recipe?.title || "Recipe"}
          variant={error ? "not_vegan" : summary?.variant ?? "maybe"}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {error ? "Error" : summary?.title ?? "Converting"}
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              {error ||
                summary?.body ||
                "Swapping animal ingredients for plant-based ones."}
            </p>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Converting recipe...
            </p>
          </NeoWindow>
        ) : null}

        {recipe ? (
          <NeoWindow
            title={showOriginal ? "Original" : "Vegan Recipe"}
            variant="vegan"
            size="md"
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <NeoButton
                  onClick={() => setShowOriginal(false)}
                  tone={showOriginal ? "base" : "secondary"}
                  className="text-xs"
                >
                  Vegan
                </NeoButton>
                <NeoButton
                  onClick={() => setShowOriginal(true)}
                  tone={showOriginal ? "secondary" : "base"}
                  className="text-xs"
                >
                  Original
                </NeoButton>
              </div>

              <div
                className="flex flex-col gap-2 border-[3px] border-[#000000] p-4 text-sm font-bold leading-6"
                style={{ backgroundColor: colors.white, color: colors.black }}
              >
                {recipe.lines.map((line, i) =>
                  line.kind === "heading" ? (
                    <h2
                      key={i}
                      className="mt-2 text-base font-black uppercase tracking-[0.06em] first:mt-0"
                    >
                      {line.original}
                    </h2>
                  ) : (
                    <p key={i} className={line.kind === "step" ? "mt-1" : ""}>
                      {showOriginal
                        ? line.original
                        : line.parts.map((part, j) =>
                            part.swap === undefined ? (
                              <span key={j}>{part.text}</span>
                            ) : (
                              <mark
                                key={j}
                                className="px-1 font-black"
                                style={{
                                  backgroundColor: colors.secondary,
                                  color: colors.black
                                }}
                              >
                                {part.text}
                              </mark>
                            )
                          )}
                    </p>
                  )
                )}
              </div>
            </div>
          </NeoWindow>
        ) : null}

        {replaced.length > 0 ? (
          <NeoWindow title="Swaps" variant="maybe" size="md">
            <ul className="flex flex-col gap-3">
              {replaced.map((swap) => (
                <li
                  key={swap.ingredient}
                  className="border-[3px] border-[#000000] p-3 text-sm font-bold"
                  style={{ backgroundColor: colors.white, color: colors.black }}
                >
                  <p className="font-black uppercase tracking-[0.04em]">
                    {swap.ingredient} → {swap.replacement}
                  </p>
                  {swap.alternative ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.04em]">
                      Or try: {swap.alternative}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </NeoWindow>
        ) : null}

        {toCheck.length > 0 ? (
          <NeoWindow title="Check the label" variant="maybe" size="md">
            <ul className="flex flex-col gap-3">
              {toCheck.map((swap) => (
                <li
                  key={swap.ingredient}
                  className="border-[3px] border-[#000000] p-3 text-sm font-bold"
                  style={{ backgroundColor: colors.white, color: colors.black }}
                >
                  <p className="font-black uppercase tracking-[0.04em]">
                    {swap.ingredient}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.04em]">
                    {swap.note}
                  </p>
                </li>
              ))}
            </ul>
          </NeoWindow>
        ) : null}

        <div className="flex flex-col gap-3">
          <NeoButton
            onClick={handleCopy}
            disabled={!recipe}
            tone={copied ? "secondary" : "primary"}
            className="w-full"
          >
            {copied ? "Copied" : "Copy Vegan Recipe"}
          </NeoButton>
          <NeoButton href="/" tone="base" className="w-full">
            Scan Another
          </NeoButton>
          {source ? (
            <NeoButton href="/results" tone="base" className="w-full">
              Ingredient Details
            </NeoButton>
          ) : null}
        </div>
      </div>
    </main>
  );
}
