import { View } from "react-native";
import type { UIResult } from "@shared/types/result";
import { NeoButton } from "./NeoButton";
import { NeoWindow } from "./NeoWindow";
import { Text } from "./Text";

const labelMap = { vegan: "Vegan", not_vegan: "Not Vegan", maybe: "Maybe" };

export function HistoryCard({
  createdAt,
  input,
  result,
  onOpen
}: {
  createdAt: string;
  input: string;
  result: UIResult;
  onOpen: () => void;
}) {
  return (
    <NeoWindow title={labelMap[result.status]} variant={result.status} size="sm">
      <View style={{ gap: 16 }}>
        <Text variant="semibold" style={{ fontSize: 14, lineHeight: 24 }} numberOfLines={3}>{input}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="bold" style={{ fontSize: 12 }}>{new Date(createdAt).toLocaleDateString()}</Text>
          <Text variant="bold" style={{ fontSize: 12 }}>{result.ingredients.length} flagged</Text>
        </View>
        <NeoButton tone="base" onPress={onOpen}>Open Detail</NeoButton>
      </View>
    </NeoWindow>
  );
}
