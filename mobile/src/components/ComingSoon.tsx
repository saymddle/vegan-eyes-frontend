import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { AppHeader } from "./AppHeader";
import { Text } from "./Text";

// Placeholder for screens that arrive in the next build of the app.
export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <AppHeader />
        <View style={styles.body}>
          <Text variant="display" style={{ fontSize: 32, lineHeight: 36 }}>{title}</Text>
          <Text variant="semibold">{body}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  body: { padding: 20, gap: 12 }
});
