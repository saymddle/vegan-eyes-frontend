import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type HostInstance,
  type ScrollViewInstance
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { AppHeader } from "./AppHeader";
import { BackIcon } from "./Icons";
import { JumpProvider, useJumpProvider } from "./ScrollJump";
import { Text } from "./Text";

type Crumb = { label: string; path?: string };

// A scrolling page on the cream background, with the logo bar or a back
// link at the top.
export function Screen({
  children,
  header = true,
  back,
  crumbs,
  edges = ["top"]
}: {
  children: React.ReactNode;
  header?: boolean;
  back?: string;
  crumbs?: Crumb[];
  edges?: ("top" | "bottom")[];
}) {
  const router = useRouter();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const contentRef = useRef<HostInstance | null>(null);
  const jump = useJumpProvider(scrollRef, contentRef);
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <JumpProvider value={jump}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          {header ? <AppHeader /> : null}
          <View ref={contentRef} style={styles.page}>
            {back ? (
              <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
                <BackIcon size={20} color={colors.forest} />
                <Text variant="bold" style={{ color: colors.forest }}>{back}</Text>
              </Pressable>
            ) : null}
            {crumbs ? (
              <View style={styles.crumbs}>
                {crumbs.map((crumb, i) => (
                  <View key={`${crumb.label}-${i}`} style={styles.crumbRow}>
                    {crumb.path ? (
                      <Pressable
                        onPress={() => router.dismissTo(crumb.path as never)}
                        style={styles.crumbLink}
                        accessibilityRole="link"
                      >
                        <Text variant="bold" style={{ fontSize: 14, color: colors.forest, textDecorationLine: "underline" }}>
                          {crumb.label}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text variant="semibold" style={{ fontSize: 14, flexShrink: 1 }} numberOfLines={1}>{crumb.label}</Text>
                    )}
                    {i < crumbs.length - 1 ? <Text variant="semibold" style={{ fontSize: 14, color: colors.muted }}>/</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </JumpProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { padding: 20, gap: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start", paddingRight: 8 },
  crumbs: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: -8 },
  crumbRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  crumbLink: { minHeight: 44, justifyContent: "center" }
});
