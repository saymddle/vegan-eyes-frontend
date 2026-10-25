import { useState } from "react";
import { View } from "react-native";
import { NeoButton } from "./NeoButton";
import { Text } from "./Text";

type Props = {
  name: string;
  status: "not_vegan" | "maybe";
  reason?: string;
  isComplex?: boolean;
  swap?: string;
};

// What's inside an ingredient's "Deeper" panel: why it was flagged, and a
// button to save that to the Library.
export function DeeperDetails({ status, reason, isComplex }: Props) {
  const [notice, setNotice] = useState("");
  const why =
    reason ||
    (status === "not_vegan"
      ? "Likely animal-derived or processed from animal sources."
      : "Needs source verification before confirming vegan status.");

  return (
    <View style={{ gap: 12 }}>
      <Text variant="bold" style={{ fontSize: 14 }}>Why: {why}</Text>
      <Text variant="bold" style={{ fontSize: 14 }}>
        Complexity:{" "}
        {isComplex ? "Complex ingredient. Supplier origin may vary." : "Simple ingredient profile."}
      </Text>
      {/* Saving needs sign-in, which arrives in the next build. */}
      <NeoButton tone="secondary" onPress={() => setNotice("Saving insights comes with sign-in in the next build.")}>
        Save Insight
      </NeoButton>
      {notice ? <Text variant="small">{notice}</Text> : null}
    </View>
  );
}
