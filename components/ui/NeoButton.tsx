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
    backgroundColor: colors.primary,
    color: colors.white
  },
  secondary: {
    backgroundColor: colors.secondary,
    color: colors.black
  },
  danger: {
    backgroundColor: colors.alert,
    color: colors.white
  },
  base: {
    backgroundColor: colors.base,
    color: colors.black
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
  const base = `inline-flex items-center justify-center border-[3px] border-[#000000] px-4 py-2 font-black uppercase tracking-[0.08em] shadow-[4px_4px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${className}`;
  const disabledClass = disabled
    ? "pointer-events-none opacity-60"
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
