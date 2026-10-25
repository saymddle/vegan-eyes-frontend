import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { colors, radius } from "@/theme";
import { NeoButton } from "./NeoButton";
import { Text } from "./Text";

const steps = [
  "Snap or upload a photo of a recipe (or a PDF), scan a product barcode, or switch to Type and paste one.",
  "Vegan Eyes swaps every animal ingredient for a plant-based one.",
  "Tap any swap to change it, then save the recipe to your Library."
];

// How the app works in three steps, opened from the "?" on Scan.
export function HelpCard({ onClose }: { onClose: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} style={styles.card}>
      <Text variant="display" style={{ fontSize: 22, lineHeight: 26 }}>Veganize your recipe</Text>
      <View style={{ gap: 8, marginTop: 12 }}>
        {steps.map((step, i) => (
          <View key={step} style={styles.row}>
            <View style={styles.num}>
              <Text variant="bold" style={{ fontSize: 12, lineHeight: 16 }}>{i + 1}</Text>
            </View>
            <Text variant="bold" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
        <NeoButton size="sm" onPress={onClose} style={{ minWidth: 96 }}>Close</NeoButton>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: 16
  },
  row: { flexDirection: "row", gap: 12 },
  num: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.butter,
    alignItems: "center",
    justifyContent: "center"
  }
});
