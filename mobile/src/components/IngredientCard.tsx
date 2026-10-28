import { useEffect } from "react";
import { StyleSheet, View, type HostInstance } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import type { UIIngredient } from "@shared/types/result";
import { colors, radius } from "@/theme";
import { DeeperDetails } from "./DeeperDetails";
import { Expandable } from "./Expandable";
import { NeoWindow } from "./NeoWindow";
import { useJump } from "./ScrollJump";
import { Text } from "./Text";

const statusLabel = { vegan: "Vegan", not_vegan: "Not Vegan", maybe: "Maybe" };

type Props = { ingredient: UIIngredient; focused: string | null; jumpKey: string };

export function IngredientCard({ ingredient, focused, jumpKey }: Props) {
  const { register } = useJump();
  const isActive = focused === ingredient.name;
  const isDimmed = Boolean(focused) && !isActive;
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(isActive ? 1.03 : 1, { damping: 14 });
    fade.value = withTiming(isDimmed ? 0.6 : 1, { duration: 300 });
  }, [isActive, isDimmed, scale, fade]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: fade.value }));

  return (
    <Animated.View ref={(view: HostInstance | null) => register(jumpKey, view)} style={[animated, isActive && styles.active]}>
      <NeoWindow title={ingredient.name} variant={ingredient.status} size="sm">
        <View style={{ gap: 16 }}>
          <View style={styles.row}>
            <Text variant="bold" style={{ fontSize: 14 }}>{statusLabel[ingredient.status]}</Text>
            <Text variant="bold" style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>
              {ingredient.swap ? `Swap: ${ingredient.swap}` : "No swap listed"}
            </Text>
          </View>
          {ingredient.status !== "vegan" ? (
            <Expandable title="Deeper">
              <DeeperDetails
                name={ingredient.name}
                status={ingredient.status}
                reason={ingredient.reason}
                isComplex={ingredient.isComplex}
                swap={ingredient.swap}
              />
            </Expandable>
          ) : null}
        </View>
      </NeoWindow>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  active: { borderRadius: radius.lg, outlineWidth: 4, outlineColor: colors.ink, outlineStyle: "solid", padding: 4 }
});
