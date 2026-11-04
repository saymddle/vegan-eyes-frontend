import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Share, View } from "react-native";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { TextLink } from "@/components/TextLink";
import { VeganRecipeView } from "@/components/VeganRecipeView";
import { deleteRecipe, getRecipeById, isAuthError, type SavedRecipe } from "@/lib/data";
import { recipePrintHtml, veganRecipeText } from "@/lib/recipeText";
import { useAccountData } from "@/lib/useAccountData";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: saved, isLoading, signedOut } = useAccountData<SavedRecipe | null>(() => getRecipeById(id), null);
  const [notice, setNotice] = useState("");

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2000);
  }

  async function handleCopy() {
    if (!saved) return;
    await Clipboard.setStringAsync(veganRecipeText(saved.recipe));
    flash("Copied");
  }

  async function handleShare() {
    if (!saved) return;
    try {
      await Share.share({ title: saved.title, message: veganRecipeText(saved.recipe) });
    } catch {
      flash("Sharing isn't available here.");
    }
  }

  async function handlePrint() {
    if (!saved) return;
    try {
      await Print.printAsync({ html: recipePrintHtml(saved.recipe, saved.title) });
    } catch {
      flash("Printing isn't available here.");
    }
  }

  async function handleDelete() {
    try {
      await deleteRecipe(id);
    } catch (error) {
      if (isAuthError(error)) {
        router.push("/auth");
        return;
      }
    }
    router.dismissTo("/library/recipes");
  }

  const title = saved?.title ?? "Recipe Detail";

  return (
    <Screen
      crumbs={[
        { label: "LIBRARY", path: "/library" },
        { label: "RECIPES", path: "/library/recipes" },
        { label: title }
      ]}
    >
      {signedOut ? (
        <SignInPrompt body="Sign in to open your saved recipes." />
      ) : isLoading ? (
        <NeoWindow title="Loading" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Loading recipe...</Text>
        </NeoWindow>
      ) : !saved ? (
        <NeoWindow title="Recipe not found" variant="maybe" size="md">
          <View style={{ gap: 16 }}>
            <Text variant="semibold" style={{ fontSize: 14 }}>This saved recipe no longer exists.</Text>
            <NeoButton tone="base" onPress={() => router.dismissTo("/library/recipes")}>Back to Recipes</NeoButton>
          </View>
        </NeoWindow>
      ) : (
        <VeganRecipeView
          recipe={{ ...saved.recipe, title: saved.title }}
          subtitle={`Saved ${new Date(saved.createdAt).toLocaleDateString()}`}
          actions={
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <NeoButton size="sm" style={{ flex: 1 }} onPress={() => void handleCopy()}>Copy</NeoButton>
                <NeoButton size="sm" tone="base" style={{ flex: 1 }} onPress={() => void handleShare()}>Share</NeoButton>
                <NeoButton size="sm" tone="base" style={{ flex: 1 }} onPress={() => void handlePrint()}>Print</NeoButton>
              </View>
              <Text variant="small" style={{ textAlign: "center", minHeight: 18 }}>{notice}</Text>
              <TextLink onPress={() => void handleDelete()} style={{ alignSelf: "center" }}>Delete recipe</TextLink>
            </View>
          }
        />
      )}
    </Screen>
  );
}
