import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { rewriteRequest, applyRewrite } from "@shared/ingredients/rewrite";
import { applySwapChoices, type SwapChoice, type SwapChoices } from "@shared/ingredients/swapChoices";
import { veganizeRecipe, type VeganizedRecipe } from "@shared/ingredients/veganize";
import { rewriteSteps } from "@/lib/api";
import { getIndex } from "@/lib/ingredientIndex";
import { recipePrintHtml, veganRecipeText, veganRecipeTitle } from "@/lib/recipeText";
import { readScan } from "@/lib/scanStore";
import { colors, radius } from "@/theme";
import { NeoButton } from "./NeoButton";
import { Text } from "./Text";
import { VeganRecipeView } from "./VeganRecipeView";

const HEADING = "Your substitutions";

function Skeleton() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View style={{ paddingVertical: 8 }}>
      <Text variant="semibold" style={{ fontSize: 18 }}>Converting your recipe...</Text>
      <Text variant="small" style={{ marginTop: 4 }}>Finding animal ingredients and their plant-based swaps.</Text>
      <Animated.View style={[{ marginTop: 16, gap: 8 }, animated]}>
        {[80, 65, 90, 50].map((width) => (
          <View key={width} style={{ height: 12, width: `${width}%`, backgroundColor: colors.skeleton, borderRadius: 999 }} />
        ))}
      </Animated.View>
    </View>
  );
}

// The converted recipe with its swap choices, save, copy and share. Shown
// in the Vegan tab of the scan result. Converting runs on the phone.
export function VeganVersion() {
  const router = useRouter();
  const scan = readScan();
  const [converted, setConverted] = useState<VeganizedRecipe | null>(null);
  const [error, setError] = useState("");
  const [choices, setChoices] = useState<SwapChoices>({});
  const [notice, setNotice] = useState("");
  const [rewrites, setRewrites] = useState<Record<string, (string | null)[]>>({});
  const [plainSteps, setPlainSteps] = useState(false);
  const isProduct = scan.product !== null;

  useEffect(() => {
    if (!scan.recipe.trim()) {
      setError("There's no recipe to convert yet. Scan or paste one to start.");
      return;
    }
    // Let the screen slide in before the work starts.
    const timer = setTimeout(() => {
      try {
        setConverted(veganizeRecipe(scan.recipe, getIndex()));
      } catch {
        setError("We couldn't convert this recipe. Try again.");
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [scan.recipe]);

  const chosen = useMemo(() => (converted ? applySwapChoices(converted, choices) : null), [converted, choices]);

  // AI-reworded steps for each set of picks, fetched once per set. An empty
  // list means the rewrite failed or changed nothing.
  const rewriteKey = useMemo(() => {
    const request = chosen && !isProduct ? rewriteRequest(chosen) : null;
    return request ? JSON.stringify(request) : null;
  }, [chosen, isProduct]);
  const rewritten = rewriteKey ? rewrites[rewriteKey] : undefined;
  const isRewriting = Boolean(rewriteKey) && rewritten === undefined;
  const hasRewrite = Boolean(rewritten?.some(Boolean));

  useEffect(() => {
    if (!rewriteKey || rewrites[rewriteKey] !== undefined) return;
    let active = true;
    // Waits a moment so flipping through swap picks sends one request.
    const timer = setTimeout(async () => {
      const steps = await rewriteSteps(rewriteKey);
      if (active) setRewrites((current) => ({ ...current, [rewriteKey]: steps }));
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [rewriteKey, rewrites]);

  const recipe = useMemo(
    () => (chosen && rewritten && hasRewrite && !plainSteps ? applyRewrite(chosen, rewritten) : chosen),
    [chosen, rewritten, hasRewrite, plainSteps]
  );

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  function handleChoose(swap: number, choice: SwapChoice | undefined) {
    setChoices((current) => {
      const next = { ...current };
      if (choice) next[swap] = choice;
      else delete next[swap];
      return next;
    });
  }

  async function handleCopy() {
    if (!recipe) return;
    await Clipboard.setStringAsync(veganRecipeText(recipe));
    flash("Copied");
  }

  async function handleShare() {
    if (!recipe) return;
    try {
      await Share.share({ title: veganRecipeTitle(recipe), message: veganRecipeText(recipe) });
    } catch {
      flash("Sharing isn't available here.");
    }
  }

  async function handlePrint() {
    if (!recipe) return;
    try {
      await Print.printAsync({ html: recipePrintHtml(recipe, veganRecipeTitle(recipe)) });
    } catch {
      flash("Printing isn't available here.");
    }
  }

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <View style={styles.errorShadow} />
        <View style={styles.error} accessibilityRole="alert">
          <Text variant="semibold" style={{ fontSize: 18 }}>{scan.recipe ? "Something went wrong" : "No recipe yet"}</Text>
          <Text variant="semibold" style={{ fontSize: 14, marginTop: 4 }}>{error}</Text>
          <NeoButton style={{ marginTop: 16 }} onPress={() => router.back()}>Scan a Recipe</NeoButton>
        </View>
      </View>
    );
  }

  if (!recipe) return <Skeleton />;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ gap: 24 }}>
      {isRewriting || hasRewrite ? (
        <View style={styles.banner}>
          <Text variant="bold" style={{ fontSize: 12, flexShrink: 1 }}>
            {isRewriting
              ? "Adjusting the steps for your swaps..."
              : plainSteps
                ? "Showing the plain swapped steps"
                : "Steps adjusted for your swaps"}
          </Text>
          {hasRewrite ? (
            <Pressable onPress={() => setPlainSteps((plain) => !plain)} style={styles.bannerLink} accessibilityRole="button">
              <Text variant="bold" style={{ fontSize: 12, textDecorationLine: "underline" }}>
                {plainSteps ? "Show adjusted steps" : "Show plain steps"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <VeganRecipeView
        recipe={recipe}
        heading={HEADING}
        choices={choices}
        onChoose={handleChoose}
        actions={
          <View style={{ gap: 12 }}>
            <NeoButton size="lg" onPress={() => flash("Saving comes with sign-in in the next build.")}>
              Save Recipe
            </NeoButton>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <NeoButton tone="base" size="sm" style={{ flex: 1 }} onPress={() => void handleCopy()}>Copy</NeoButton>
              <NeoButton tone="base" size="sm" style={{ flex: 1 }} onPress={() => void handleShare()}>Share</NeoButton>
              <NeoButton tone="base" size="sm" style={{ flex: 1 }} onPress={() => void handlePrint()}>Print</NeoButton>
            </View>
            <Text variant="small" style={{ textAlign: "center", minHeight: 18 }} accessibilityLiveRegion="polite">
              {notice}
            </Text>
            <Pressable onPress={() => router.back()} style={styles.scanAnother} accessibilityRole="button">
              <Text variant="bold" style={{ fontSize: 12, textDecorationLine: "underline" }}>Scan another</Text>
            </Pressable>
          </View>
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  errorWrap: { position: "relative", marginRight: 4, marginBottom: 4 },
  errorShadow: { position: "absolute", top: 4, left: 4, right: -4, bottom: -4, borderRadius: radius.lg, backgroundColor: colors.ink },
  error: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.lg, padding: 16, backgroundColor: colors.butter },
  banner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white
  },
  bannerLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  scanAnother: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }
});
