import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";
import { Text } from "./Text";

type Props = { value: "scan" | "type"; onChange: (value: "scan" | "type") => void };

// One button that flips between Scan and Type. The active side is filled
// forest green.
export function NeoSwitch({ value, onChange }: Props) {
  const isScan = value === "scan";
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onChange(isScan ? "type" : "scan");
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isScan }}
      accessibilityLabel={`Current mode: ${isScan ? "scan" : "type"}`}
      style={styles.switch}
    >
      {(["Scan", "Type"] as const).map((label) => {
        const active = (label === "Scan") === isScan;
        return (
          <View key={label} style={[styles.side, active && styles.active]}>
            <Text variant="bold" style={{ fontSize: 14, color: active ? colors.cream : colors.ink }}>
              {label}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switch: {
    height: 48,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    padding: 3
  },
  side: {
    minWidth: 64,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  active: { backgroundColor: colors.forest }
});
