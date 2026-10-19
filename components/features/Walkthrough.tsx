"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { hasFlag, setFlag } from "@/lib/onboarding/flags";
import { colors } from "@/lib/theme/colors";

export type WalkthroughStep = {
  // Matches a data-tour="..." attribute on the page.
  target: string;
  title: string;
  body: string;
  extra?: React.ReactNode;
};

type Props = {
  steps: WalkthroughStep[];
  // Remembers that this walkthrough was seen.
  storageKey: string;
  // Waits for this target before starting, e.g. content that loads later.
  waitFor?: string;
  // Only starts while this is true.
  enabled?: boolean;
};

type Box = { top: number; left: number; width: number; height: number };

const PAD = 6;
const GAP = 14;

function findTarget(name: string) {
  return document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
}

// A short guided tour: dims the page, outlines one control at a time and
// explains it in a card beside it. Shown once per browser.
export default function Walkthrough({
  steps,
  storageKey,
  waitFor,
  enabled = true
}: Props) {
  const [active, setActive] = useState<WalkthroughStep[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [tipHeight, setTipHeight] = useState(0);
  const tipRef = useRef<HTMLDivElement | null>(null);

  // Start once the page is ready and the tour hasn't been seen.
  useEffect(() => {
    if (!enabled || active || hasFlag(storageKey)) return;

    const ready = () => findTarget(waitFor ?? steps[0].target);
    const begin = () => {
      const present = steps.filter((step) => findTarget(step.target));
      if (present.length) setActive(present);
    };

    if (ready()) {
      begin();
      return;
    }

    const timer = window.setInterval(() => {
      if (ready()) {
        window.clearInterval(timer);
        begin();
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [enabled, active, storageKey, steps, waitFor]);

  const step = active?.[stepIndex];

  const measure = useCallback(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setBox({
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2
    });
  }, [step]);

  useEffect(() => {
    if (!step) return;
    // Scroll only up or down; scrollIntoView can also nudge the page sideways.
    const el = findTarget(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - (window.innerHeight - rect.height) / 2,
        behavior: "smooth"
      });
    }
    measure();
    const settle = window.setTimeout(measure, 450);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [step, measure]);

  const hasBox = box !== null;
  useLayoutEffect(() => {
    setTipHeight(tipRef.current?.offsetHeight ?? 0);
    tipRef.current?.focus({ preventScroll: true });
  }, [step, hasBox]);

  const finish = useCallback(() => {
    setFlag(storageKey);
    setActive(null);
  }, [storageKey]);

  useEffect(() => {
    if (!step) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  if (!active || !step || !box) return null;

  const isLast = stepIndex === active.length - 1;
  const viewHeight = window.innerHeight;
  const viewWidth = document.documentElement.clientWidth;
  const tipWidth = Math.min(340, viewWidth - 32);
  const left = Math.min(
    Math.max(16, box.left + box.width / 2 - tipWidth / 2),
    viewWidth - tipWidth - 16
  );
  const below = box.top + box.height + GAP;
  const above = box.top - GAP - tipHeight;
  // Below the control, else above it, else over its lower edge.
  const top =
    below + tipHeight <= viewHeight - 16
      ? below
      : above >= 16
        ? above
        : Math.max(16, viewHeight - tipHeight - 16);

  // Rendered on <body> so it sits above the bottom nav on every page.
  return createPortal(
    <div className="fixed inset-0 z-[60]" aria-live="polite">
      {/* Blocks taps on the dimmed page; tapping it does nothing. */}
      <div className="absolute inset-0" />
      <div
        className="pointer-events-none absolute border-[3px] border-[#000000] transition-all duration-200"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          boxShadow: `0 0 0 4px ${colors.secondary}, 0 0 0 9999px rgba(0,0,0,0.6)`
        }}
      />
      <div
        ref={tipRef}
        role="dialog"
        aria-labelledby="walkthrough-title"
        tabIndex={-1}
        className="absolute border-[3px] border-[#000000] p-4 shadow-[6px_6px_0px_#000000] outline-none"
        style={{
          top,
          left,
          width: tipWidth,
          backgroundColor: colors.white,
          color: colors.black
        }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.08em] opacity-70">
          Step {stepIndex + 1} of {active.length}
        </p>
        <h2
          id="walkthrough-title"
          className="mt-1 text-lg font-black uppercase leading-tight tracking-[0.02em]"
        >
          {step.title}
        </h2>
        <p className="mt-2 text-sm font-bold leading-6">{step.body}</p>
        {step.extra ? <div className="mt-3">{step.extra}</div> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          {isLast ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={finish}
              className="min-h-[44px] px-1 text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4"
            >
              Skip tour
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              isLast ? finish() : setStepIndex((current) => current + 1)
            }
            className="min-h-[44px] border-[3px] border-[#000000] px-5 text-sm font-black uppercase tracking-[0.08em] shadow-[3px_3px_0px_#000000]"
            style={{ backgroundColor: colors.primary, color: colors.white }}
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
