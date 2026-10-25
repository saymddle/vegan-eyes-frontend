"use client";

import Link from "next/link";
import { colors } from "@/lib/theme/colors";

const steps = [
  "Snap or upload a photo of a recipe (or a PDF), scan a product barcode, or switch to Type and paste one.",
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
      className="border-2 border-[#20251F] p-4 rounded-xl"
      style={{ backgroundColor: colors.white, color: colors.black }}
    >
      <h2 className="text-[22px]">
        Veganize your recipe
      </h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm font-bold">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#20251F] text-xs font-bold rounded-xl"
              style={{ backgroundColor: colors.secondary }}
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] rounded-xl border-2 border-[#20251F] px-5 text-sm font-bold shadow-[2px_2px_0px_#20251F]"
          style={{ backgroundColor: colors.forest, color: colors.cream }}
        >
          Close
        </button>
        <Link
          href="/welcome"
          className="inline-flex min-h-[44px] items-center text-sm font-bold underline underline-offset-4"
        >
          Replay the intro
        </Link>
      </div>
    </section>
  );
}
