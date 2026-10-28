import { Stack } from "expo-router";
import { colors } from "@/theme";

// Keeps the list screen under a screen opened straight from elsewhere.
export const unstable_settings = { initialRouteName: "index" };

export default function ProfileStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />;
}
