"use client";

import { colors } from "@/lib/theme/colors";

type Props = {
  value: "scan" | "type";
  onChange: (val: "scan" | "type") => void;
  // Marks it for the first-scan walkthrough.
  tour?: string;
};

export default function NeoSwitch({ value, onChange, tour }: Props) {
  const isScan = value === "scan";

  return (
    <div
      data-tour={tour}
      onClick={() => onChange(isScan ? "type" : "scan")}
      className="relative flex h-10 w-28 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border-[3px] border-[#000000] transition-all"
      style={{
        backgroundColor: isScan ? colors.primary : colors.secondary
      }}
      role="switch"
      aria-checked={!isScan}
      aria-label={`Current mode: ${isScan ? "scan" : "type"}`}
    >
      <div className="absolute z-10 flex w-full justify-between px-3 text-xs font-bold uppercase tracking-[0.08em]">
        <span
          className={isScan ? "opacity-100" : "opacity-30"}
          style={{ color: isScan ? colors.white : colors.black }}
        >
          SCAN
        </span>
        <span
          className={!isScan ? "opacity-100" : "opacity-30"}
          style={{ color: colors.black }}
        >
          TYPE
        </span>
      </div>

      <div
        className={`absolute z-0 h-8 w-8 rounded-full transition-all duration-200 ${
          isScan ? "translate-x-1" : "translate-x-[72px]"
        }`}
        style={{ backgroundColor: colors.black }}
      />
    </div>
  );
}
