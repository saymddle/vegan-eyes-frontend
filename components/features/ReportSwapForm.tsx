"use client";

import { useState } from "react";
import type { SwapReportReason } from "@/lib/api/swapReports";
import { colors } from "@/lib/theme/colors";

const reasons: { value: SwapReportReason; label: string }[] = [
  { value: "wrong_swap", label: "The swap doesn't work in this recipe" },
  { value: "not_vegan", label: "The swap isn't vegan" },
  { value: "already_vegan", label: "This ingredient is already vegan" },
  { value: "other", label: "Something else" }
];

type Props = {
  ingredient: string;
  onSubmit: (reason: SwapReportReason, note: string) => Promise<void>;
};

// A small form under a swap for telling us it is wrong.
export default function ReportSwapForm({ ingredient, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SwapReportReason>("wrong_swap");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle"
  );

  async function submit() {
    setState("sending");
    try {
      await onSubmit(reason, note);
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <p className="text-xs font-black uppercase tracking-[0.04em]">
        Thanks. We&apos;ll review this swap.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] self-start text-xs font-black uppercase tracking-[0.04em] underline underline-offset-4"
      >
        Report a wrong swap
      </button>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2 border-t-2 border-[#000000] pt-3">
      <legend className="sr-only">
        What&apos;s wrong with the {ingredient} swap?
      </legend>
      <p className="text-xs font-black uppercase tracking-[0.04em]">
        What&apos;s wrong with this swap?
      </p>
      {reasons.map((option) => (
        <label
          key={option.value}
          className="flex min-h-[44px] items-center gap-2 text-sm"
        >
          <input
            type="radio"
            name={`reason-${ingredient}`}
            value={option.value}
            checked={reason === option.value}
            onChange={() => setReason(option.value)}
            className="h-4 w-4 accent-black"
          />
          {option.label}
        </label>
      ))}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Optional: what would you use instead?"
        className="w-full border-2 border-[#000000] p-2 text-sm outline-none"
        style={{ backgroundColor: colors.white, color: colors.black }}
      />
      {state === "failed" ? (
        <p className="text-xs font-black" style={{ color: colors.alert }}>
          Couldn&apos;t send the report. Try again.
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={state === "sending"}
          className="min-h-[44px] border-2 border-[#000000] px-3 text-xs font-black uppercase tracking-[0.04em]"
          style={{ backgroundColor: colors.black, color: colors.white }}
        >
          {state === "sending" ? "Sending..." : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] px-3 text-xs font-black uppercase tracking-[0.04em] underline underline-offset-4"
        >
          Cancel
        </button>
      </div>
    </fieldset>
  );
}
