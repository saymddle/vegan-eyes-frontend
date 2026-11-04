import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { getDeeper, isAuthError, toggleFavorite, type DeeperItem } from "@/lib/data";
import { useAccountData } from "@/lib/useAccountData";

export default function DeeperScreen() {
  const router = useRouter();
  const { data: items, setData: setItems, isLoading, error: loadError, signedOut } = useAccountData<DeeperItem[]>(
    getDeeper,
    []
  );
  const [error, setError] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visible = useMemo(() => {
    const filtered = favoritesOnly ? items.filter((item) => item.is_favorite) : items;
    return [...filtered].sort((left, right) =>
      left.is_favorite !== right.is_favorite
        ? Number(right.is_favorite) - Number(left.is_favorite)
        : new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
  }, [favoritesOnly, items]);

  async function handleToggleFavorite(item: DeeperItem) {
    try {
      const updated = await toggleFavorite(item.id, !item.is_favorite);
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setError("");
    } catch (favoriteError) {
      if (isAuthError(favoriteError)) {
        router.push("/auth");
        return;
      }
      setError(favoriteError instanceof Error ? favoriteError.message : "Failed to update favorite");
    }
  }

  const shownError = error || loadError;

  return (
    <Screen crumbs={[{ label: "LIBRARY", path: "/library" }, { label: "DEEPER" }]}>
      <NeoWindow title="Deeper" variant="vegan" size="lg">
        <View style={{ gap: 16 }}>
          <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>Saved ingredient insights.</Text>
          <NeoButton tone={favoritesOnly ? "secondary" : "base"} onPress={() => setFavoritesOnly((current) => !current)}>
            {favoritesOnly ? "All Insights" : "Favorites Only"}
          </NeoButton>
        </View>
      </NeoWindow>

      {signedOut ? (
        <SignInPrompt body="Sign in to see your saved insights." />
      ) : isLoading ? (
        <NeoWindow title="Loading" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Loading deeper insights...</Text>
        </NeoWindow>
      ) : shownError ? (
        <NeoWindow title="Error" variant="not_vegan" size="sm" boxed>
          <Text variant="semibold" style={{ fontSize: 14 }}>{shownError}</Text>
        </NeoWindow>
      ) : visible.length === 0 ? (
        <NeoWindow title="No saved insights yet" variant="maybe" size="md">
          <View style={{ gap: 16 }}>
            <Text variant="semibold" style={{ fontSize: 14 }}>
              Save ingredient insights from Results to build your learning library.
            </Text>
            <NeoButton tone="base" onPress={() => router.navigate("/")}>Scan to Discover</NeoButton>
          </View>
        </NeoWindow>
      ) : (
        visible.map((item) => (
          <NeoWindow key={item.id} title={item.ingredient} variant="maybe" size="md">
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <Text variant="bold" style={{ fontSize: 14 }}>{item.is_favorite ? "Favorite" : "Saved insight"}</Text>
                <NeoButton
                  size="sm"
                  tone={item.is_favorite ? "secondary" : "base"}
                  accessibilityLabel={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  onPress={() => void handleToggleFavorite(item)}
                >
                  <Text variant="bold" style={{ fontSize: 18 }}>{item.is_favorite ? "★" : "☆"}</Text>
                </NeoButton>
              </View>
              <Text variant="bold" style={{ fontSize: 14, lineHeight: 24 }}>{item.reason}</Text>
              <Text variant="semibold" style={{ fontSize: 14, marginTop: 8 }}>Substitutes:</Text>
              {item.substitutes.map((substitute) => (
                <View key={`${item.id}-${substitute}`} style={{ flexDirection: "row", gap: 8, paddingLeft: 4 }}>
                  <Text variant="bold" style={{ fontSize: 14 }}>•</Text>
                  <Text variant="bold" style={{ fontSize: 14, flex: 1 }}>{substitute}</Text>
                </View>
              ))}
              <Text variant="small">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </NeoWindow>
        ))
      )}
    </Screen>
  );
}
