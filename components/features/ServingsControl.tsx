"use client";

import { formatAmount } from "@/lib/ingredients/scaleRecipe";
import { colors } from "@/lib/theme/colors";

// Batch sizes offered when the recipe doesn't say how many it serves.
const BATCHES = [0.5, 1, 1.5, 2, 3, 4];

type Props = {
  // How many the recipe serves as written, or null when it doesn't say.
  base: number | null;
  factor: number;
  onChange: (factor: number) => void;
};

const button =
  "flex h-11 w-11 items-center justify-center border-2 border-[#000000] text-xl font-black disabled:opacity-40";

export default function ServingsControl({ base, factor, onChange }: Props) {
  const count = base ? Math.round(base * factor) : null;
  const batch = BATCHES.indexOf(factor);

  const less = () =>
    count
      ? onChange((count - 1) / (base as number))
      : onChange(BATCHES[batch - 1]);
  const more = () =>
    count
      ? onChange((count + 1) / (base as number))
      : onChange(BATCHES[batch + 1]);
  const canLess = count ? count > 1 : batch > 0;
  const canMore = count ? count < 99 : batch < BATCHES.length - 1;

  const label = base ? "Servings" : "Batch";
  const value = count ? String(count) : `${formatAmount(factor)}×`;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-xs font-black uppercase tracking-[0.06em]">
        {label}
      </span>
      <div className="flex items-center" role="group" aria-label={label}>
        <button
          type="button"
          onClick={less}
          disabled={!canLess}
          className={button}
          style={{ backgroundColor: colors.white, color: colors.black }}
          aria-label={base ? "Fewer servings" : "Smaller batch"}
        >
          −
        </button>
        <span
          className="flex h-11 min-w-14 items-center justify-center border-y-2 border-[#000000] px-2 text-base font-black"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={more}
          disabled={!canMore}
          className={button}
          style={{ backgroundColor: colors.white, color: colors.black }}
          aria-label={base ? "More servings" : "Bigger batch"}
        >
          +
        </button>
      </div>
      {factor !== 1 ? (
        <button
          type="button"
          onClick={() => onChange(1)}
          className="min-h-11 text-xs font-black uppercase underline underline-offset-4"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
