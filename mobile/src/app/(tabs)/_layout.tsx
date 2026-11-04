import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LibraryTabIcon, ProfileTabIcon, ScanTabIcon } from "@/components/Icons";
import { Text } from "@/components/Text";
import { colors, fonts, radius } from "@/theme";

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

// Community is hidden for the first release, so three tabs.
const items = [
  { name: "(scan)", label: "Scan", Icon: ScanTabIcon },
  { name: "library", label: "Library", Icon: LibraryTabIcon },
  { name: "profile", label: "Profile", Icon: ProfileTabIcon }
] as const;

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const route = state.routes.find((r) => r.name === item.name);
        if (!route) return null;
        const active = state.routes[state.index]?.key === route.key;
        return (
          <Pressable
            key={item.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            onPress={() => {
              void Haptics.selectionAsync();
              if (!active) navigateToTab(route.key);
              // Tapping Scan again from a result goes back to Scan.
              else if (item.name === "(scan)" && router.canDismiss()) router.dismissAll();
            }}
            style={styles.item}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <item.Icon size={22} color={active ? colors.forest : colors.ink} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.cream } }}
    >
      <Tabs.Screen name="(scan)" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    paddingTop: 8,
    paddingHorizontal: 8
  },
  item: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  pill: { height: 32, width: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  pillActive: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.leaf },
  label: { fontSize: 11, lineHeight: 14, fontFamily: fonts.semibold },
  labelActive: { fontFamily: fonts.bold, color: colors.forest }
});
