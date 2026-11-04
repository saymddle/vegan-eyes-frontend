import { useMemo, useRef, useState } from "react";
import { View, type HostInstance } from "react-native";
import type { SavedScan } from "@/lib/data";
import { HistoryCard } from "./HistoryCard";
import { IngredientCard } from "./IngredientCard";
import { NeoWindow } from "./NeoWindow";
import { useJump } from "./ScrollJump";
import { Text } from "./Text";

// Saved scans, newest first, with the opened one's details underneath, as
// on the website's Library and Recent pages.
export function ScanList({ records, emptyNote }: { records: SavedScan[]; emptyNote?: boolean }) {
  const { register, jumpTo } = useJump();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [records]
  );
  const selected = sorted.find((record) => record.id === selectedId) || sorted[0];
  const detailRef = useRef<HostInstance | null>(null);

  return (
    <>
      {sorted.map((record) => (
        <HistoryCard
          key={record.id}
          createdAt={record.timestamp}
          input={record.input}
          result={record.result}
          onOpen={() => {
            setSelectedId(record.id);
            setTimeout(() => jumpTo("scan-detail"), 50);
          }}
        />
      ))}
      {selected ? (
        <View
          ref={(view) => {
            detailRef.current = view;
            register("scan-detail", view);
          }}
        >
          <NeoWindow title="Open Detail" variant={selected.result.status} size="md">
            <View style={{ gap: 16 }}>
              <Text style={{ lineHeight: 24 }}>{selected.input}</Text>
              {selected.result.ingredients.length === 0 && emptyNote ? (
                <NeoWindow title="Ingredients" variant="vegan" size="sm">
                  <Text variant="semibold" style={{ fontSize: 14 }}>No flagged ingredients saved for this result.</Text>
                </NeoWindow>
              ) : (
                selected.result.ingredients.map((ingredient, index) => (
                  <IngredientCard
                    key={`${ingredient.name}-${index}`}
                    ingredient={ingredient}
                    focused={null}
                    jumpKey={`saved-${selected.id}-${index}`}
                  />
                ))
              )}
            </View>
          </NeoWindow>
        </View>
      ) : null}
    </>
  );
}
