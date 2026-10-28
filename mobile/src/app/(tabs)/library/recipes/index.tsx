import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Field } from "@/components/Field";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { getRecipes, type SavedRecipe } from "@/lib/data";
import { useAccountData } from "@/lib/useAccountData";

function RecipeCard({ recipe }: { recipe: SavedRecipe }) {
  const router = useRouter();
  const swapped = recipe.recipe.swaps.filter((swap) => swap.replacement);
  return (
    <NeoWindow title={recipe.title} variant="vegan" size="sm">
      <View style={{ gap: 12 }}>
        <Text variant="semibold" style={{ fontSize: 14, lineHeight: 24 }} numberOfLines={3}>
          {swapped.length ? swapped.map((swap) => `${swap.ingredient} → ${swap.replacement}`).join(" · ") : "Already vegan"}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="bold" style={{ fontSize: 12 }}>{new Date(recipe.createdAt).toLocaleDateString()}</Text>
          <Text variant="bold" style={{ fontSize: 12 }}>
            {swapped.length} {swapped.length === 1 ? "swap" : "swaps"}
          </Text>
        </View>
        <NeoButton tone="base" onPress={() => router.push(`/library/recipes/${recipe.id}`)}>Open Recipe</NeoButton>
      </View>
    </NeoWindow>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const { data: recipes, isLoading, signedOut } = useAccountData<SavedRecipe[]>(getRecipes, []);
  const [search, setSearch] = useState("");

  // Matches the title, the swapped ingredients and what they became.
  const visible = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return recipes;
    return recipes.filter((saved) =>
      [saved.title, ...saved.recipe.swaps.flatMap((swap) => [swap.ingredient, swap.replacement ?? ""])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [recipes, search]);

  return (
    <Screen crumbs={[{ label: "LIBRARY", path: "/library" }, { label: "RECIPES" }]}>
      <NeoWindow title="Recipes" variant="vegan" size="lg">
        <View style={{ gap: 16 }}>
          <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>Saved recipes.</Text>
          <Text>Vegan versions of the recipes you have scanned and saved.</Text>
          {recipes.length > 0 ? (
            <Field
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or ingredient"
              accessibilityLabel="Search saved recipes"
              autoCapitalize="none"
            />
          ) : null}
        </View>
      </NeoWindow>

      {signedOut ? (
        <SignInPrompt body="Sign in to see your saved recipes." />
      ) : isLoading ? (
        <NeoWindow title="Loading" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Loading recipes...</Text>
        </NeoWindow>
      ) : recipes.length === 0 ? (
        <NeoWindow title="No saved recipes yet" variant="maybe" size="sm">
          <View style={{ gap: 16 }}>
            <Text variant="semibold" style={{ fontSize: 14 }}>
              Scan a recipe, then tap Save Recipe to keep its vegan version here.
            </Text>
            <NeoButton tone="base" onPress={() => router.navigate("/")}>Run a Scan</NeoButton>
          </View>
        </NeoWindow>
      ) : visible.length === 0 ? (
        <Text variant="semibold" style={{ fontSize: 14, textAlign: "center" }}>
          No saved recipes match &ldquo;{search.trim()}&rdquo;.
        </Text>
      ) : (
        visible.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
      )}
    </Screen>
  );
}
