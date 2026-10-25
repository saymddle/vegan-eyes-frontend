"use client";

import Link from "next/link";
import { colors } from "@/lib/theme/colors";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger" | "base";
  className?: string;
};

const toneMap = {
  primary: {
    backgroundColor: colors.forest,
    color: colors.cream
  },
  secondary: {
    backgroundColor: colors.butter,
    color: colors.ink
  },
  danger: {
    backgroundColor: colors.tomato,
    color: colors.ink
  },
  base: {
    backgroundColor: colors.white,
    color: colors.ink
  }
};

export default function NeoButton({
  children,
  onClick,
  href,
  type = "button",
  disabled = false,
  tone = "primary",
  className = ""
}: Props) {
  const base = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#20251F] px-4 py-2 text-[15px] font-bold shadow-[2px_2px_0px_#20251F] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#20251F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${className}`;
  const disabledClass = disabled
    ? "pointer-events-none opacity-50 shadow-none"
    : "";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} ${disabledClass}`}
        style={toneMap[tone]}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${disabledClass}`}
      style={toneMap[tone]}
    >
      {children}
    </button>
  );
}
