import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, type HostInstance, type ScrollViewInstance } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { UIResult, UIStatus } from "@shared/types/result";
import { BackIcon } from "@/components/Icons";
import { IngredientCard } from "@/components/IngredientCard";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { ProductCard } from "@/components/ProductCard";
import { JumpProvider, useJumpProvider } from "@/components/ScrollJump";
import { Text } from "@/components/Text";
import { VeganVersion } from "@/components/VeganVersion";
import { runCheck } from "@/lib/check";
import { highlightSegments } from "@/lib/highlight";
import { isAuthError, saveScan } from "@/lib/data";
import { readScan } from "@/lib/scanStore";
import { colors, radius } from "@/theme";

const statusCopy: Record<UIStatus, { title: string; body: string }> = {
  vegan: { title: "Vegan", body: "No non-vegan ingredients were flagged in this scan." },
  not_vegan: { title: "Not Vegan", body: "One or more ingredients likely come from animal-derived sources." },
  maybe: { title: "Maybe", body: "This result contains ambiguous ingredients that need source checks." }
};

export default function ResultsScreen() {
  const router = useRouter();
  const scan = readScan();
  const product = scan.product;
  // A packaged product can't be cooked differently, so open on its label.
  const [tab, setTab] = useState<"vegan" | "original">(product ? "original" : "vegan");
  const [focused, setFocused] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const contentRef = useRef<HostInstance | null>(null);
  const jump = useJumpProvider(scrollRef, contentRef);

  const { result, error } = useMemo((): { result: UIResult | null; error: string } => {
    if (!scan.check) return { result: null, error: "No scan input found. Return to Scan and analyze a label." };
    try {
      return { result: runCheck(scan.check), error: "" };
    } catch {
      return { result: null, error: "Unable to analyze ingredients right now." };
    }
  }, [scan.check]);

  useEffect(() => {
    if (!result) return;
    void Haptics.notificationAsync(
      result.status === "vegan"
        ? Haptics.NotificationFeedbackType.Success
        : result.status === "not_vegan"
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
    );
  }, [result]);

  const summary = result ? statusCopy[result.status] : { title: "Error", body: error };
  const mainVariant = error ? "not_vegan" : (result?.status ?? "maybe");
  const segments = useMemo(
    () => (result ? highlightSegments(scan.check, result.ingredients) : []),
    [result, scan.check]
  );

  async function handleSaveResult() {
    if (!result || !scan.check) return;
    try {
      await saveScan(scan.check, result);
      setIsSaved(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (isAuthError(error)) {
        router.push("/auth");
        return;
      }
      setSaveError(error instanceof Error ? error.message : "Failed to save scan");
    }
  }

  function focusIngredient(name: string) {
    void Haptics.selectionAsync();
    setFocused(name);
    jump.jumpTo(`ingredient-${name}`);
    setTimeout(() => setFocused((current) => (current === name ? null : current)), 2000);
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <JumpProvider value={jump}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 40 }}>
          <View ref={contentRef} style={styles.page}>
            <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
              <BackIcon size={20} color={colors.forest} />
              <Text variant="bold" style={{ color: colors.forest }}>Scan</Text>
            </Pressable>

            {product ? <ProductCard product={product} /> : null}

            <Animated.View entering={FadeInDown.duration(300).springify().damping(16)} style={{ opacity: focused ? 0.6 : 1 }}>
              <NeoWindow title="Scan Result" variant={mainVariant} size="lg" boxed>
                <View style={{ gap: 16 }}>
                  <Text variant="display" style={{ fontSize: 44, lineHeight: 46, color: colors.ink }}>{summary.title}</Text>
                  <Text style={{ fontSize: 15, lineHeight: 24 }}>{summary.body}</Text>
                </View>
              </NeoWindow>
            </Animated.View>

            <View style={styles.tabs} accessibilityRole="tablist">
              {(
                [
                  ["original", product ? "Label" : "Original", colors.butter],
                  ["vegan", "Vegan", colors.leaf]
                ] as const
              ).map(([key, label, background]) => {
                const active = tab === key;
                return (
                  <View key={key} style={{ flex: 1 }}>
                    {active ? <View style={styles.tabShadow} /> : null}
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setTab(key);
                      }}
                      style={[styles.tab, { backgroundColor: active ? background : colors.white }]}
                    >
                      <Text variant="bold" style={{ fontSize: 14 }}>{label}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Stays mounted so picks survive switching tabs. */}
            <View style={tab === "vegan" ? undefined : styles.hidden}>
              <VeganVersion />
            </View>

            {tab === "original" && result ? (
              <Animated.View entering={FadeIn.duration(200)} style={{ gap: 24 }}>
                {result.ingredients.length === 0 ? (
                  <NeoWindow title="Empty" variant="vegan" size="sm">
                    <Text variant="semibold" style={{ fontSize: 14 }}>No flagged ingredients in this response.</Text>
                  </NeoWindow>
                ) : null}
                <NeoWindow title={product ? "Ingredient List" : "Original Recipe"} variant={result.status} size="md">
                  <View style={{ gap: 16 }}>
                    <Text style={{ lineHeight: 28 }}>
                      {segments.map((segment, i) =>
                        segment.ingredient ? (
                          <Text
                            key={i}
                            variant="bold"
                            onPress={() => focusIngredient(segment.ingredient!.name)}
                            style={{
                              lineHeight: 28,
                              textDecorationLine: "underline",
                              backgroundColor: segment.ingredient.status === "not_vegan" ? colors.tomato : colors.butter
                            }}
                          >
                            {segment.text}
                          </Text>
                        ) : (
                          <Text key={i} style={{ lineHeight: 28 }}>{segment.text}</Text>
                        )
                      )}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                      <View style={[styles.legend, { backgroundColor: colors.tomato }]}>
                        <Text variant="bold" style={{ fontSize: 12, lineHeight: 16 }}>Red = Non-Vegan</Text>
                      </View>
                      <View style={[styles.legend, { backgroundColor: colors.butter }]}>
                        <Text variant="bold" style={{ fontSize: 12, lineHeight: 16 }}>Yellow = Unclear</Text>
                      </View>
                    </View>
                  </View>
                </NeoWindow>
                {result.ingredients.map((ingredient, index) => (
                  <IngredientCard
                    key={`${ingredient.name}-${ingredient.status}-${index}`}
                    ingredient={ingredient}
                    focused={focused}
                    jumpKey={`ingredient-${ingredient.name}`}
                  />
                ))}
              </Animated.View>
            ) : null}

            <View style={{ gap: 12, opacity: focused ? 0.6 : 1 }}>
              <NeoButton tone="base" onPress={() => router.back()}>Back to Scan</NeoButton>
              <NeoButton
                tone={isSaved ? "secondary" : "primary"}
                disabled={!result || Boolean(error) || isSaved}
                onPress={() => void handleSaveResult()}
              >
                {isSaved ? "Saved" : "Save Scan"}
              </NeoButton>
              {saveError ? <Text variant="small" style={{ textAlign: "center" }}>{saveError}</Text> : null}
            </View>
          </View>
        </ScrollView>
      </JumpProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { padding: 20, gap: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start", paddingRight: 8 },
  tabs: { flexDirection: "row", gap: 12 },
  tab: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  tabShadow: { position: "absolute", top: 2, left: 2, right: -2, bottom: -2, borderRadius: radius.md, backgroundColor: colors.ink },
  hidden: { display: "none" },
  legend: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 }
});
