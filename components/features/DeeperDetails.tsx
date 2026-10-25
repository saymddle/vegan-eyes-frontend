"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import NeoButton from "@/components/ui/NeoButton";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { saveDeeper } from "@/lib/api/saveDeeper";

type Props = {
  name: string;
  status: "not_vegan" | "maybe";
  reason?: string;
  isComplex?: boolean;
  swap?: string;
  // Extra controls at the bottom, such as "Report a wrong swap".
  children?: ReactNode;
};

// What's inside an ingredient's "Deeper" panel: why it was flagged, and a
// button to save that to the Library.
export default function DeeperDetails({
  name,
  status,
  reason,
  isComplex,
  swap,
  children
}: Props) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const why =
    reason ||
    (status === "not_vegan"
      ? "Likely animal-derived or processed from animal sources."
      : "Needs source verification before confirming vegan status.");

  async function handleSave() {
    try {
      await saveDeeper({
        ingredient: name,
        reason: why,
        substitutes: [swap || "No substitute listed"]
      });
      setIsSaved(true);
      setSaveError("");
    } catch (error) {
      if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
        router.push(authPath());
        return;
      }
      setSaveError(
        error instanceof Error ? error.message : "Failed to save insight"
      );
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm font-bold leading-6">
      <p>Why: {why}</p>
      <p>
        Complexity:{" "}
        {isComplex
          ? "Complex ingredient. Supplier origin may vary."
          : "Simple ingredient profile."}
      </p>
      <NeoButton tone="secondary" onClick={handleSave} disabled={isSaved}>
        {isSaved ? "Insight Saved" : "Save Insight"}
      </NeoButton>
      {saveError ? <p>{saveError}</p> : null}
      {children}
    </div>
  );
}
