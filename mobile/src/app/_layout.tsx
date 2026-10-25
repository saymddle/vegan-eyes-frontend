import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { LilitaOne_400Regular } from "@expo-google-fonts/lilita-one/400Regular";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { refreshIndex } from "@/lib/ingredientIndex";
import { colors } from "@/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, failed] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    LilitaOne_400Regular
  });

  useEffect(() => {
    // Gets the latest ingredient list in the background.
    void refreshIndex();
  }, []);

  useEffect(() => {
    if (loaded || failed) void SplashScreen.hideAsync();
  }, [loaded, failed]);

  if (!loaded && !failed) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
