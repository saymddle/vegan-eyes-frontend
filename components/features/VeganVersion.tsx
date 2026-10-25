"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import VeganRecipeView, {
  veganRecipeText,
  veganRecipeTitle
} from "@/components/features/VeganRecipeView";
import NeoButton from "@/components/ui/NeoButton";
import { saveRecipe } from "@/lib/api/recipes";
import { reportSwap, type SwapReportReason } from "@/lib/api/swapReports";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import {
  applySwapChoices,
  type SwapChoice,
  type SwapChoices
} from "@/lib/ingredients/swapChoices";
import {
  applyRewrite,
  rewriteRequest,
  type RewriteResult
} from "@/lib/ingredients/rewrite";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import {
  RECIPE_STORAGE_KEY,
  readProduct,
  readRecipeSource
} from "@/lib/store/recipeInput";
import { colors } from "@/lib/theme/colors";
import { shareText } from "@/lib/utils/share";

// The converted recipe with its swap choices, save, copy and share. Shown
// in the Vegan tab of the scan result.
export default function VeganVersion() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [converted, setConverted] = useState<VeganizedRecipe | null>(null);
  const [choices, setChoices] = useState<SwapChoices>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // The conversion with the cook's picks.
  const chosen = useMemo(
    () => (converted ? applySwapChoices(converted, choices) : null),
    [converted, choices]
  );

  // AI-reworded steps for each set of picks, fetched once per set. An empty
  // list means the rewrite failed or changed nothing.
  const [rewrites, setRewrites] = useState<Record<string, (string | null)[]>>(
    {}
  );
  const [plainSteps, setPlainSteps] = useState(false);
  // A packaged product's label has no cooking steps to adjust.
  const [isProduct, setIsProduct] = useState(false);
  const rewriteKey = useMemo(() => {
    const request = chosen && !isProduct ? rewriteRequest(chosen) : null;
    return request ? JSON.stringify(request) : null;
  }, [chosen, isProduct]);
  const rewritten = rewriteKey ? rewrites[rewriteKey] : undefined;
  const isRewriting = Boolean(rewriteKey) && rewritten === undefined;
  const hasRewrite = Boolean(rewritten?.some(Boolean));

  useEffect(() => {
    if (!rewriteKey || rewrites[rewriteKey] !== undefined) return;
    let active = true;
    // Waits a moment so flipping through swap picks sends one request.
    const timer = window.setTimeout(async () => {
      let steps: (string | null)[] = [];
      try {
        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: rewriteKey
        });
        if (res.ok) steps = ((await res.json()) as RewriteResult).steps ?? [];
      } catch {
        // The plain steps are shown instead.
      }
      if (active) setRewrites((current) => ({ ...current, [rewriteKey]: steps }));
    }, 600);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [rewriteKey, rewrites]);

  // What is shown, copied and saved.
  const recipe = useMemo(
    () =>
      chosen && rewritten && hasRewrite && !plainSteps
        ? applyRewrite(chosen, rewritten)
        : chosen,
    [chosen, rewritten, hasRewrite, plainSteps]
  );

  const convert = useCallback(async (isActive: () => boolean) => {
    const stored = sessionStorage.getItem(RECIPE_STORAGE_KEY) || "";
    setSource(stored);
    setIsProduct(readProduct() !== null);
    setError("");

    if (!stored.trim()) {
      setError("There's no recipe to convert yet. Scan or paste one to start.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/veganize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: stored })
      });

      if (!res.ok) {
        throw new Error(
          "We couldn't convert this recipe. Check your connection and try again."
        );
      }

      const data = (await res.json()) as VeganizedRecipe;
      if (isActive()) {
        setConverted(data);
        setChoices({});
      }
    } catch (requestError) {
      if (isActive()) {
        setError(
          requestError instanceof Error &&
            requestError.message.startsWith("We couldn't")
            ? requestError.message
            : "We couldn't convert this recipe. Check your connection and try again."
        );
      }
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void convert(() => active);
    return () => {
      active = false;
    };
  }, [convert]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  function handleChoose(swap: number, choice: SwapChoice | undefined) {
    setChoices((current) => {
      const next = { ...current };
      if (choice) next[swap] = choice;
      else delete next[swap];
      return next;
    });
    // A changed recipe is a different recipe from the one saved.
    setSavedId(null);
  }

  async function handleReport(
    swap: number,
    reason: SwapReportReason,
    note: string
  ) {
    if (!converted) return;
    // Report what the converter suggested, not what the cook picked.
    const suggested = converted.swaps[swap];
    const line = converted.lines.find((recipeLine) =>
      recipeLine.parts.some((part) => part.swap === swap)
    );
    try {
      await reportSwap({
        ingredient: suggested.ingredient,
        suggestedSwap: suggested.replacement,
        recipeLine: line?.original,
        reason,
        note
      });
    } catch (reportError) {
      if (
        reportError instanceof Error &&
        reportError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
      }
      throw reportError;
    }
  }

  async function handleCopy() {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(veganRecipeText(recipe));
      flash("Copied");
    } catch {
      flash("Copy failed. Select the text and copy it instead.");
    }
  }

  async function handleShare() {
    if (!recipe) return;
    const result = await shareText(
      veganRecipeTitle(recipe),
      veganRecipeText(recipe)
    );
    if (result === "copied") flash("Copied to share");
    if (result === "failed") flash("Sharing isn't available here.");
  }

  async function handleSave() {
    if (!recipe || savedId) return;
    setIsSaving(true);

    try {
      const saved = await saveRecipe(
        veganRecipeTitle(recipe),
        readRecipeSource(),
        source,
        recipe
      );
      setSavedId(saved.id);
    } catch (saveError) {
      if (
        saveError instanceof Error &&
        saveError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
        return;
      }
      flash("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <section
          className="py-2"
          aria-busy="true"
        >
          <p className="text-lg font-semibold">
            Converting your recipe...
          </p>
          <p className="mt-1 text-xs font-semibold">
            Finding animal ingredients and their plant-based swaps.
          </p>
          <div className="mt-4 flex animate-pulse flex-col gap-2">
            {[80, 65, 90, 50].map((width) => (
              <div
                key={width}
                className="h-3"
                style={{ width: `${width}%`, backgroundColor: "#EADFC8", borderRadius: 999 }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section
          className="rounded-2xl border-2 border-[#20251F] p-4 shadow-[4px_4px_0px_#20251F]"
          style={{ backgroundColor: colors.butter }}
          role="alert"
        >
          <p className="text-lg font-semibold">
            {source ? "Something went wrong" : "No recipe yet"}
          </p>
          <p className="mt-1 text-sm font-semibold">{error}</p>
          <div className="mt-4 flex flex-col gap-3">
            {source ? (
              <NeoButton
                onClick={() => void convert(() => true)}
                className="w-full"
              >
                Try Again
              </NeoButton>
            ) : null}
            <NeoButton
              href="/"
              tone={source ? "base" : "primary"}
              className="w-full"
            >
              Scan a Recipe
            </NeoButton>
          </div>
        </section>
      ) : null}

      {!isLoading && recipe && (isRewriting || hasRewrite) ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#20251F] px-3 py-2 text-xs font-bold rounded-xl"
          style={{ backgroundColor: colors.white, color: colors.black }}
          aria-live="polite"
        >
          <span>
            {isRewriting
              ? "Adjusting the steps for your swaps..."
              : plainSteps
                ? "Showing the plain swapped steps"
                : "Steps adjusted for your swaps"}
          </span>
          {hasRewrite ? (
            <button
              type="button"
              onClick={() => {
                setPlainSteps((plain) => !plain);
                setSavedId(null);
              }}
              className="min-h-[44px] px-1 underline underline-offset-4"
            >
              {plainSteps ? "Show adjusted steps" : "Show plain steps"}
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && recipe ? (
        <VeganRecipeView
          recipe={recipe}
          heading="Your substitutions"
          hideVersionToggle
          choices={choices}
          onChoose={handleChoose}
          onReport={handleReport}
          actions={
            <div data-tour="save" className="flex flex-col gap-3">
              {savedId ? (
                <NeoButton
                  href={`/library/recipes/${savedId}`}
                  tone="secondary"
                  className="w-full py-3 text-lg"
                >
                  Saved. Open in Library
                </NeoButton>
              ) : (
                <NeoButton
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 text-lg"
                >
                  {isSaving ? "Saving..." : "Save Recipe"}
                </NeoButton>
              )}
              <div className="grid grid-cols-3 gap-3">
                <NeoButton
                  onClick={handleCopy}
                  tone="base"
                  className="min-h-[44px] text-xs"
                >
                  Copy
                </NeoButton>
                <NeoButton
                  onClick={handleShare}
                  tone="base"
                  className="min-h-[44px] text-xs"
                >
                  Share
                </NeoButton>
                <NeoButton
                  onClick={() => window.print()}
                  tone="base"
                  className="min-h-[44px] text-xs"
                >
                  Print
                </NeoButton>
              </div>
              <p
                className="min-h-5 text-center text-xs font-semibold"
                aria-live="polite"
              >
                {notice}
              </p>
              <div className="flex justify-center text-xs font-bold">
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center px-2 underline underline-offset-4"
                >
                  Scan another
                </Link>
              </div>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
