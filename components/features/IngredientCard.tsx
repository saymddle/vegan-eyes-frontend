"use client";

import type { UIIngredient } from "@/lib/types/result";
import Expandable from "@/components/ui/Expandable";
import NeoWindow from "@/components/ui/NeoWindow";
import { getIngredientAnchorId } from "@/lib/utils/highlightIngredients";
import DeeperDetails from "./DeeperDetails";

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
  const isActive = focusedIngredient === ingredient.name;
  const isDimmed = Boolean(focusedIngredient) && !isActive;

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

          {ingredient.status !== "vegan" ? (
            <Expandable title="Deeper">
              <DeeperDetails
                name={ingredient.name}
                status={ingredient.status}
                reason={ingredient.reason}
                isComplex={ingredient.isComplex}
                swap={ingredient.swap}
              />
            </Expandable>
          ) : null}
        </div>
      </NeoWindow>
    </div>
  );
}
