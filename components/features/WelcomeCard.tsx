"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/theme/colors";

const SEEN_KEY = "vegan-eyes:welcome-seen";

const steps = [
  "Snap a photo of a recipe, or switch to Type and paste one.",
  "Vegan Eyes swaps every animal ingredient for a plant-based one.",
  "Tap any swap to change it, then save the recipe to your Library."
];

// Shown once, on a first visit, so new cooks know what the app does.
export default function WelcomeCard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(SEEN_KEY));
    } catch {
      // Storage can be blocked; skip the welcome rather than show it forever.
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Nothing to do; it simply shows again next visit.
    }
  }

  if (!show) return null;

  return (
    <section
      className="border-[3px] border-[#000000] p-4"
      style={{ backgroundColor: colors.white, color: colors.black }}
    >
      <h2 className="text-lg font-black uppercase tracking-[0.02em]">
        Make any recipe vegan
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
        onClick={dismiss}
        className="mt-4 min-h-[40px] border-2 border-[#000000] px-4 text-xs font-black uppercase tracking-[0.06em]"
        style={{ backgroundColor: colors.black, color: colors.white }}
      >
        Got it
      </button>
    </section>
  );
}
