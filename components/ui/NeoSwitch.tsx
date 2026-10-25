"use client";

type Props = {
  value: "scan" | "type";
  onChange: (val: "scan" | "type") => void;
  // Marks it for the first-scan walkthrough.
  tour?: string;
};

// One button that flips between Scan and Type. The active side is filled
// forest green.
export default function NeoSwitch({ value, onChange, tour }: Props) {
  const isScan = value === "scan";
  const side = (active: boolean) =>
    `flex h-full min-w-[64px] items-center justify-center rounded-full px-4 text-sm font-bold transition-colors ${
      active ? "bg-[#214E34] text-[#FFF7E8]" : "text-[#20251F]"
    }`;

  return (
    <button
      type="button"
      data-tour={tour}
      onClick={() => onChange(isScan ? "type" : "scan")}
      className="flex h-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-[#20251F] bg-white p-[3px]"
      role="switch"
      aria-checked={!isScan}
      aria-label={`Current mode: ${isScan ? "scan" : "type"}`}
    >
      <span className={side(isScan)}>Scan</span>
      <span className={side(!isScan)}>Type</span>
    </button>
  );
}
