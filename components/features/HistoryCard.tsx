"use client";

import type { UIResult } from "@/lib/types/result";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";

type Props = {
  createdAt: string;
  input: string;
  result: UIResult;
  onOpen: () => void;
};

const labelMap = {
  vegan: "Vegan",
  not_vegan: "Not Vegan",
  maybe: "Maybe"
};

export default function HistoryCard({ createdAt, input, result, onOpen }: Props) {
  return (
    <NeoWindow title={labelMap[result.status]} variant={result.status} size="sm">
      <div className="flex flex-col gap-4">
        <p className="line-clamp-3 text-sm font-semibold leading-6">
          {input}
        </p>
        <div className="flex items-center justify-between gap-4 text-xs font-bold">
          <p>{new Date(createdAt).toLocaleDateString()}</p>
          <p>{result.ingredients.length} flagged</p>
        </div>
        <NeoButton onClick={onOpen} tone="base" className="w-full">
          Open Detail
        </NeoButton>
      </div>
    </NeoWindow>
  );
}
