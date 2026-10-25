import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { colors, fonts } from "@/theme";
import { Text } from "./Text";

// The logo bar at the top of each screen. It scrolls with the page.
export function AppHeader() {
  return (
    <View style={styles.bar}>
      <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
      <Text style={styles.name}>Vegan Eyes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    backgroundColor: colors.cream
  },
  logo: { width: 36, height: 36 },
  name: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.forest }
});
