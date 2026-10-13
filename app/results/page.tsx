"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import IngredientCard from "@/components/features/IngredientCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { checkIngredients } from "@/lib/api/check";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { saveScan } from "@/lib/api/saveScan";
import { colors } from "@/lib/theme/colors";
import type { UIResult, UIStatus } from "@/lib/types/result";
import {
  getIngredientAnchorId,
  highlightIngredients
} from "@/lib/utils/highlightIngredients";

import { INPUT_STORAGE_KEY } from "@/lib/store/recipeInput";

const statusCopy: Record<UIStatus, { title: string; body: string }> = {
  vegan: {
    title: "Vegan",
    body: "No non-vegan ingredients were flagged in this scan."
  },
  not_vegan: {
    title: "Not Vegan",
    body: "One or more ingredients likely come from animal-derived sources."
  },
  maybe: {
    title: "Maybe",
    body: "This result contains ambiguous ingredients that need source checks."
  }
};

export default function ResultsPage() {
  const router = useRouter();
  const [scanInput, setScanInput] = useState("");
  const [result, setResult] = useState<UIResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [focusedIngredient, setFocusedIngredient] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isActive = true;

    async function loadResult() {
      const storedInput = sessionStorage.getItem(INPUT_STORAGE_KEY) || "";
      setScanInput(storedInput);

      if (!storedInput) {
        if (isActive) {
          setError("No scan input found. Return to Scan and analyze a label.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await checkIngredients(storedInput);

        if (isActive) {
          setResult(response);
          setError("");
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to analyze ingredients right now."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const name = target.dataset.ingredient;

      if (!name) {
        return;
      }

      setFocusedIngredient(name);

      const el = document.getElementById(getIngredientAnchorId(name));

      if (!el) {
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-[#000000]", "scale-[1.02]");

      setTimeout(() => {
        el.classList.remove("ring-4", "ring-[#000000]", "scale-[1.02]");
      }, 800);
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, []);

  const summary = useMemo(() => {
    if (result) {
      return statusCopy[result.status];
    }

    if (error) {
      return {
        title: "Error",
        body: error
      };
    }

    return {
      title: "Loading",
      body: "Checking the ingredient list against the Vegan Eyes backend."
    };
  }, [error, result]);

  async function handleSaveResult() {
    if (!result || !scanInput) {
      return;
    }

    try {
      await saveScan(scanInput, result);
      setIsSaved(true);
    } catch (saveError) {
      if (
        saveError instanceof Error &&
        saveError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
        return;
      }

      setError(
        saveError instanceof Error ? saveError.message : "Failed to save scan"
      );
    }
  }

  const mainVariant = error ? "not_vegan" : result?.status ?? "maybe";

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      {focusedIngredient ? (
        <div
          onClick={() => setFocusedIngredient(null)}
          className="fixed inset-0 z-0 bg-black/20 backdrop-blur-[1px]"
        />
      ) : null}

      <div className="relative z-10 mx-auto flex max-w-[500px] flex-col gap-6">
        <div
          className={`transition-all duration-300 ease-out ${
            focusedIngredient ? "opacity-60 blur-[1px]" : "opacity-100"
          }`}
        >
          <NeoWindow title="Scan Result" variant={mainVariant} size="lg">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                {summary.title}
              </h1>
              <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
                {summary.body}
              </p>
            </div>
          </NeoWindow>
        </div>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Running backend check...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error && result?.ingredients.length === 0 ? (
          <NeoWindow title="Empty" variant="vegan" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              No flagged ingredients in this response.
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error && result ? (
          <NeoWindow
            title="Highlighted Input"
            variant={result.status}
            size="md"
            className={focusedIngredient ? "relative z-20" : ""}
          >
            <div className="flex flex-col gap-4">
              <div
                className="border-[3px] border-[#000000] p-4 text-sm font-bold uppercase leading-7 tracking-[0.04em]"
                style={{
                  backgroundColor: colors.white,
                  color: colors.black
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightIngredients(
                    scanInput,
                    result.ingredients,
                    focusedIngredient
                  )
                }}
              />
              <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.08em]">
                <span
                  className="border-[3px] border-[#000000] px-2 py-1"
                  style={{ backgroundColor: colors.alert, color: colors.white }}
                >
                  Red = Non-Vegan
                </span>
                <span
                  className="border-[3px] border-[#000000] px-2 py-1"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.black
                  }}
                >
                  Yellow = Unclear
                </span>
              </div>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading && !error
          ? result?.ingredients.map((ingredient, index) => (
              <IngredientCard
                key={`${ingredient.name}-${ingredient.status}-${index}`}
                ingredient={ingredient}
                focusedIngredient={focusedIngredient}
              />
            ))
          : null}

        <div
          className={`flex flex-col gap-3 transition-all duration-300 ease-out ${
            focusedIngredient ? "opacity-60 blur-[1px]" : "opacity-100"
          }`}
        >
          <NeoButton href="/" tone="base" className="w-full">
            Back to Scan
          </NeoButton>
          <NeoButton
            onClick={handleSaveResult}
            disabled={!result || Boolean(error) || isLoading || isSaved}
            tone={isSaved ? "secondary" : "primary"}
            className="w-full"
          >
            {isSaved ? "Saved" : "Save Scan"}
          </NeoButton>
        </div>
      </div>
    </main>
  );
}
