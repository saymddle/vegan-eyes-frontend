"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import IngredientCard from "@/components/features/IngredientCard";
import VeganVersion from "@/components/features/VeganVersion";
import Walkthrough, {
  type WalkthroughStep
} from "@/components/features/Walkthrough";
import BackButton from "@/components/ui/BackButton";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { checkIngredients } from "@/lib/api/check";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { saveScan } from "@/lib/api/saveScan";
import { RESULTS_TOUR_SEEN } from "@/lib/onboarding/flags";
import { colors } from "@/lib/theme/colors";
import type { UIResult, UIStatus } from "@/lib/types/result";
import {
  getIngredientAnchorId,
  highlightIngredients
} from "@/lib/utils/highlightIngredients";

import type { Product } from "@/lib/products/openFoodFacts";
import { INPUT_STORAGE_KEY, readProduct } from "@/lib/store/recipeInput";

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

// The second half of the first-scan walkthrough.
const tourSteps: WalkthroughStep[] = [
  {
    target: "verdict",
    title: "Your verdict",
    body: "This tells you at a glance whether the recipe was already vegan."
  },
  {
    target: "version-tabs",
    title: "Original or vegan",
    body: "Original shows the animal ingredients in red. Vegan shows your converted recipe."
  },
  {
    target: "swaps",
    title: "Change a swap",
    body: "Tap any swap to pick another option or keep the original ingredient."
  },
  {
    target: "save",
    title: "Save and share",
    body: "Save the recipe to your Library (you'll need to sign in), or copy, share or print it."
  }
];

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
  const [tab, setTab] = useState<"vegan" | "original">("vegan");
  // Set when the scan was a product barcode.
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const scanned = readProduct();
    setProduct(scanned);
    // A packaged product can't be cooked differently, so open on its label.
    if (scanned) setTab("original");
  }, []);

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

  const mainVariant = error ? "not_vegan" : (result?.status ?? "maybe");

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      {focusedIngredient ? (
        <div
          onClick={() => setFocusedIngredient(null)}
          className="fixed inset-0 z-0 bg-black/20 backdrop-blur-[1px]"
        />
      ) : null}

      <div className="relative z-10 mx-auto flex max-w-[500px] flex-col gap-6">
        <Walkthrough
          steps={tourSteps}
          storageKey={RESULTS_TOUR_SEEN}
          waitFor="save"
        />
        <BackButton label="Scan" />
        {product ? <ProductCard product={product} /> : null}
        <div
          data-tour="verdict"
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

        <div
          data-tour="version-tabs"
          className="grid grid-cols-2 gap-3"
          role="tablist"
          aria-label="Recipe version"
        >
          {(
            [
              [
                "original",
                product ? "Label" : "Original",
                colors.secondary,
                colors.black
              ],
              ["vegan", "Vegan", colors.primary, colors.white]
            ] as const
          ).map(([key, label, background, text]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-[48px] border-[3px] border-[#000000] px-3 text-sm font-black uppercase tracking-[0.08em] transition-all ${
                tab === key
                  ? "shadow-[4px_4px_0px_#000000]"
                  : "shadow-none"
              }`}
              style={
                tab === key
                  ? { backgroundColor: background, color: text }
                  : { backgroundColor: colors.base, color: colors.black }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className={tab === "vegan" ? "" : "hidden"} role="tabpanel">
          <VeganVersion />
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

        {tab === "original" && !isLoading && !error && result ? (
          <NeoWindow
            title={product ? "Ingredient List" : "Original Recipe"}
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

function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div
      className="flex items-center gap-4 border-[3px] border-[#000000] p-4 shadow-[6px_6px_0px_#000000]"
      style={{ backgroundColor: colors.white, color: colors.black }}
    >
      {product.image && !imageFailed ? (
        <img
          src={product.image}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-20 w-20 shrink-0 border-[3px] border-[#000000] object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center border-[3px] border-[#000000] text-4xl"
        >
          📦
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {product.brand ? (
          <p className="text-xs font-black uppercase tracking-[0.08em] opacity-80">
            {product.brand}
          </p>
        ) : null}
        <h2 className="break-words text-lg font-black uppercase leading-tight">
          {product.name || "Unnamed product"}
        </h2>
        {product.labelledVegan ? (
          <p
            className="self-start border-2 border-[#000000] px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em]"
            style={{ backgroundColor: colors.primary, color: colors.white }}
          >
            Labelled vegan on the pack
          </p>
        ) : null}
        {product.traces ? (
          <p className="text-xs font-bold leading-5">
            <span className="font-black uppercase">Pack warning:</span>{" "}
            {product.traces}. That&apos;s about shared factories, not an
            ingredient, so it doesn&apos;t change the verdict.
          </p>
        ) : null}
        <p className="text-[11px] font-bold leading-5">
          Barcode {product.barcode}. Product data from{" "}
          <a
            href={`https://world.openfoodfacts.org/product/${product.barcode}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Open Food Facts
          </a>
          .
        </p>
      </div>
    </div>
  );
}
