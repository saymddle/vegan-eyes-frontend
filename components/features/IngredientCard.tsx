"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UIIngredient } from "@/lib/types/result";
import Expandable from "@/components/ui/Expandable";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { AUTH_REQUIRED_ERROR } from "@/lib/api/scansAuth";
import { saveDeeper } from "@/lib/api/saveDeeper";
import { getIngredientAnchorId } from "@/lib/utils/highlightIngredients";

const statusLabel = {
  vegan: "Vegan",
  not_vegan: "Not Vegan",
  maybe: "Maybe"
};

type Props = {
  ingredient: UIIngredient;
  focusedIngredient?: string | null;
};

export default function IngredientCard({
  ingredient,
  focusedIngredient = null
}: Props) {
  const router = useRouter();
  const [isInsightSaved, setIsInsightSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isActive = focusedIngredient === ingredient.name;
  const isDimmed = Boolean(focusedIngredient) && !isActive;
  const reason =
    ingredient.reason ||
    (ingredient.status === "not_vegan"
      ? "Likely animal-derived or processed from animal sources."
      : "Needs source verification before confirming vegan status.");

  async function handleSaveInsight() {
    try {
      await saveDeeper({
        ingredient: ingredient.name,
        reason,
        substitutes: [ingredient.swap || "No substitute listed"]
      });
      setIsInsightSaved(true);
      setSaveError("");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === AUTH_REQUIRED_ERROR
      ) {
        router.push("/auth");
        return;
      }

      setSaveError(
        error instanceof Error ? error.message : "Failed to save insight"
      );
    }
  }

  return (
    <div
      id={getIngredientAnchorId(ingredient.name)}
      className={`transition-all duration-300 ease-out ${
        isActive
          ? "relative z-20 scale-[1.04] opacity-100 shadow-[12px_12px_0_#000000]"
          : ""
      } ${isDimmed ? "opacity-60" : "opacity-100"}`}
    >
      <NeoWindow title={ingredient.name} variant={ingredient.status} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 text-sm font-black uppercase tracking-[0.08em]">
            <p>{statusLabel[ingredient.status]}</p>
            <p>
              {ingredient.swap ? `Swap: ${ingredient.swap}` : "No swap listed"}
            </p>
          </div>

          <Expandable title="Deeper">
            <div className="flex flex-col gap-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              <p>Why: {reason}</p>
              <p>
                Nourishment Fact:{" "}
                {ingredient.reason ||
                  "No nutrition detail returned for this ingredient."}
              </p>
              <p>
                Complexity:{" "}
                {ingredient.isComplex
                  ? "Complex ingredient. Supplier origin may vary."
                  : "Simple ingredient profile."}
              </p>
              <NeoButton
                tone="secondary"
                onClick={handleSaveInsight}
                disabled={isInsightSaved}
              >
                {isInsightSaved ? "Insight Saved" : "Save Insight"}
              </NeoButton>
              {saveError ? <p>{saveError}</p> : null}
            </div>
          </Expandable>
        </div>
      </NeoWindow>
    </div>
  );
}
