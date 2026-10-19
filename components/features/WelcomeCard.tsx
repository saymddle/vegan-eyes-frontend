"use client";

import { colors } from "@/lib/theme/colors";

const steps = [
  "Snap a photo of a recipe, or switch to Type and paste one.",
  "Vegan Eyes swaps every animal ingredient for a plant-based one.",
  "Tap any swap to change it, then save the recipe to your Library."
];

type Props = {
  onClose: () => void;
};

// How the app works in three steps, opened from the "?" on the scan screen.
export default function WelcomeCard({ onClose }: Props) {
  return (
    <section
      id="how-it-works"
      className="border-[3px] border-[#000000] p-4"
      style={{ backgroundColor: colors.white, color: colors.black }}
    >
      <h2 className="text-lg font-black uppercase tracking-[0.02em]">
        Veganize your recipe
      </h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm font-bold">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#000000] text-xs font-black"
              style={{ backgroundColor: colors.secondary }}
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 min-h-[40px] border-2 border-[#000000] px-4 text-xs font-black uppercase tracking-[0.06em]"
        style={{ backgroundColor: colors.black, color: colors.white }}
      >
        Close
      </button>
    </section>
  );
}
