import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { isAuthError, saveDeeper } from "@/lib/data";
import { NeoButton } from "./NeoButton";
import { Text } from "./Text";

type Props = {
  name: string;
  status: "not_vegan" | "maybe";
  reason?: string;
  isComplex?: boolean;
  swap?: string;
  // Extra controls at the bottom, such as "Report a wrong swap".
  children?: React.ReactNode;
};

// What's inside an ingredient's "Deeper" panel: why it was flagged, and a
// button to save that to the Library.
export function DeeperDetails({ name, status, reason, isComplex, swap, children }: Props) {
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
      await saveDeeper({ ingredient: name, reason: why, substitutes: [swap || "No substitute listed"] });
      setIsSaved(true);
      setSaveError("");
    } catch (error) {
      if (isAuthError(error)) {
        router.push("/auth");
        return;
      }
      setSaveError(error instanceof Error ? error.message : "Failed to save insight");
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Text variant="bold" style={{ fontSize: 14 }}>Why: {why}</Text>
      <Text variant="bold" style={{ fontSize: 14 }}>
        Complexity:{" "}
        {isComplex ? "Complex ingredient. Supplier origin may vary." : "Simple ingredient profile."}
      </Text>
      <NeoButton tone="secondary" disabled={isSaved} onPress={() => void handleSave()}>
        {isSaved ? "Insight Saved" : "Save Insight"}
      </NeoButton>
      {saveError ? <Text variant="bold" style={{ fontSize: 14 }}>{saveError}</Text> : null}
      {children}
    </View>
  );
}
