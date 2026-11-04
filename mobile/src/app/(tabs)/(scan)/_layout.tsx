import { Stack } from "expo-router";
import { colors } from "@/theme";

// Scan and its result share the Scan tab, so swiping back from a result
// returns to Scan.
export default function ScanStack() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
