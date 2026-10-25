import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type HostInstance } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { SwapChoice, SwapChoices } from "@shared/ingredients/swapChoices";
import type { RecipeSwap, VeganizedRecipe } from "@shared/ingredients/veganize";
import { recipeSummary, veganRecipeTitle } from "@/lib/recipeText";
import { colors, radius } from "@/theme";
import { DeeperDetails } from "./DeeperDetails";
import { Expandable } from "./Expandable";
import { NeoWindow } from "./NeoWindow";
import { useJump } from "./ScrollJump";
import { Text } from "./Text";

type Props = {
  recipe: VeganizedRecipe;
  heading?: string;
  choices?: SwapChoices;
  onChoose?: (swap: number, choice: SwapChoice | undefined) => void;
  // Buttons right under the recipe, above the swap cards.
  actions?: React.ReactNode;
};

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.forest }]}
    >
      <Text variant="bold" style={{ fontSize: 14, color: active ? colors.cream : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

const statusLabel = { non_vegan: "Not Vegan", unclear: "Maybe" } as const;

// One colored card per flagged ingredient: what it became, the other
// options, and the "Deeper" details, all in one place.
function SwapCard({
  swap,
  index,
  active,
  choice,
  onChoose
}: {
  swap: RecipeSwap;
  index: number;
  active: boolean;
  choice?: SwapChoice;
  onChoose?: Props["onChoose"];
}) {
  const { register } = useJump();
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(active ? 1.02 : 1, { damping: 14 });
  }, [active, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Picks are made on the suggested swap, so read them off the original.
  const suggested = choice === "alternative" ? swap.alternative : swap.replacement;
  const alternative = choice === "alternative" ? swap.replacement : swap.alternative;
  const variant = swap.status === "non_vegan" ? "not_vegan" : "maybe";
  const canChoose = Boolean(onChoose && swap.replacement);
  const summary = swap.kept
    ? `Kept as ${swap.ingredient}`
    : swap.replacement
      ? `Swap: ${swap.replacement}`
      : (swap.note ?? "Check the label");

  return (
    <Animated.View
      ref={(view: HostInstance | null) => register(`swap-${index}`, view)}
      style={[animated, styles.cardWrap, active && styles.cardActive]}
    >
      <NeoWindow title={swap.ingredient} variant={variant} size="sm" boxed>
        <View style={{ gap: 16 }}>
          <View style={styles.row}>
            <Text variant="bold" style={{ fontSize: 14 }}>{statusLabel[swap.status]}</Text>
            <Text variant="bold" style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>{summary}</Text>
          </View>

          {canChoose && onChoose ? (
            <View style={styles.chips} accessibilityLabel={`Swap for ${swap.ingredient}`}>
              <ChoiceChip label={suggested ?? ""} active={!choice} onPress={() => onChoose(index, undefined)} />
              {alternative ? (
                <ChoiceChip
                  label={alternative}
                  active={choice === "alternative"}
                  onPress={() => onChoose(index, "alternative")}
                />
              ) : null}
              <ChoiceChip
                label={`Keep ${swap.ingredient}`}
                active={choice === "original"}
                onPress={() => onChoose(index, "original")}
              />
            </View>
          ) : null}

          <Expandable title="Deeper">
            <DeeperDetails
              name={swap.ingredient}
              status={variant}
              reason={swap.about}
              isComplex={swap.complex}
              swap={swap.replacement}
            />
          </Expandable>
        </View>
      </NeoWindow>
    </Animated.View>
  );
}

export function VeganRecipeView({ recipe, heading, choices = {}, onChoose, actions }: Props) {
  const { jumpTo } = useJump();
  const [activeSwap, setActiveSwap] = useState<number | null>(null);
  const title = heading ?? veganRecipeTitle(recipe);

  const indexed = recipe.swaps.map((swap, index) => ({ swap, index }));
  // Swaps first, then the ones that only need a label check.
  const cards = [
    ...indexed.filter(({ swap }) => swap.replacement),
    ...indexed.filter(({ swap }) => !swap.replacement)
  ];

  function focusSwap(index: number) {
    void Haptics.selectionAsync();
    setActiveSwap(index);
    setTimeout(() => setActiveSwap(null), 1500);
    jumpTo(`swap-${index}`);
  }

  return (
    <View style={{ gap: 24 }}>
      <View>
        <View style={styles.titleBlock}>
          <Text variant="display">{title}</Text>
          <Text variant="small" style={{ marginTop: 8 }}>{recipeSummary(recipe)}</Text>
        </View>
        <View style={{ paddingTop: 16, gap: 8 }}>
          {recipe.lines.map((line, i) =>
            line.kind === "heading" && (line.original === title || line.vegan === title) ? null : line.kind ===
              "heading" ? (
              <Text key={i} variant="display" style={{ fontSize: 18, lineHeight: 22, marginTop: i === 0 ? 0 : 12 }}>
                {line.vegan}
              </Text>
            ) : (
              <Text key={i} style={{ lineHeight: 28, marginTop: line.kind === "step" ? 4 : 0 }}>
                {line.parts.map((part, j) =>
                  part.swap === undefined || recipe.swaps[part.swap]?.kept ? (
                    <Text key={j} style={{ lineHeight: 28 }}>{part.text}</Text>
                  ) : (
                    <Text
                      key={j}
                      onPress={() => focusSwap(part.swap as number)}
                      accessibilityRole="button"
                      accessibilityHint={`Swapped for ${recipe.swaps[part.swap]?.ingredient}. Tap to change.`}
                      variant="semibold"
                      style={styles.swapped}
                    >
                      {part.text}
                    </Text>
                  )
                )}
              </Text>
            )
          )}
        </View>
      </View>

      {actions}

      {cards.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text variant="display" style={{ fontSize: 24, lineHeight: 28 }}>Swaps</Text>
          {onChoose ? (
            <Text variant="small" style={{ marginTop: -4 }}>
              Pick a swap on any card, or keep the original. Tap a highlighted word in the recipe to jump to its card.
            </Text>
          ) : null}
          <View style={{ gap: 24 }}>
            {cards.map(({ swap, index }) => (
              <SwapCard
                key={swap.ingredient}
                swap={swap}
                index={index}
                active={activeSwap === index}
                choice={choices[index]}
                onChoose={onChoose}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { borderBottomWidth: 2, borderBottomColor: colors.ink, paddingBottom: 16 },
  swapped: {
    lineHeight: 28,
    backgroundColor: colors.swapHighlight,
    textDecorationLine: "underline",
    textDecorationColor: colors.forest
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: colors.white,
    justifyContent: "center"
  },
  cardWrap: { borderRadius: radius.lg + 4 },
  cardActive: { outlineWidth: 4, outlineColor: colors.forest, outlineStyle: "solid", outlineOffset: 2 }
});
