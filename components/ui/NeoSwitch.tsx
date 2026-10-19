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

  // The black pill sits under the active mode, whose label turns white.
  const label = (active: boolean) => ({
    color: active ? colors.white : isScan ? colors.white : colors.black,
    opacity: active ? 1 : 0.8
  });

  return (
    <button
      type="button"
      data-tour={tour}
      onClick={() => onChange(isScan ? "type" : "scan")}
      className="relative flex h-11 w-28 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border-[3px] border-[#000000] transition-all"
      style={{
        backgroundColor: isScan ? colors.primary : colors.secondary
      }}
      role="switch"
      aria-checked={!isScan}
      aria-label={`Current mode: ${isScan ? "scan" : "type"}`}
    >
      <div
        className={`absolute left-[3px] z-0 h-[32px] w-[48px] rounded-full transition-all duration-200 ${
          isScan ? "translate-x-0" : "translate-x-[52px]"
        }`}
        style={{ backgroundColor: colors.black }}
      />
      <div className="absolute inset-x-[3px] z-10 flex text-xs font-bold uppercase tracking-[0.06em]">
        <span className="w-[48px] text-center" style={label(isScan)}>
          Scan
        </span>
        <span className="ml-[4px] w-[48px] text-center" style={label(!isScan)}>
          Type
        </span>
      </div>
    </button>
  );
}
