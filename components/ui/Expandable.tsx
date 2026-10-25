"use client";

import { useState } from "react";
import { colors } from "@/lib/theme/colors";
import NeoButton from "./NeoButton";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function Expandable({ title = "Deeper", children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <NeoButton
        onClick={() => setIsOpen((current) => !current)}
        tone={isOpen ? "secondary" : "base"}
        className="w-full"
      >
        {isOpen ? `Hide ${title}` : title}
      </NeoButton>

      {isOpen ? (
        <div
          className="rounded-2xl border-2 border-[#20251F] p-4"
          style={{ backgroundColor: colors.white, color: colors.black }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
