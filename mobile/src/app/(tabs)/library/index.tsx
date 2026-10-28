import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { ScanList } from "@/components/ScanList";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { getScans, type SavedScan } from "@/lib/data";
import { useAccountData } from "@/lib/useAccountData";
import { colors, fonts, radius } from "@/theme";

// The Library tab: saved scans with search, and links to Recent, Recipes
// and Deeper.
export default function LibraryScreen() {
  const router = useRouter();
  const { data: records, isLoading, error, signedOut } = useAccountData<SavedScan[]>(getScans, []);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const query = search.toLowerCase().trim();
    return records.filter((record) =>
      `${record.input} ${record.result.status} ${record.result.ingredients.map((item) => item.name).join(" ")}`
        .toLowerCase()
        .includes(query)
    );
  }, [records, search]);

  return (
    <Screen>
      <View style={{ gap: 20 }}>
        <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>Saved scan library.</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search ingredient or status"
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoCapitalize="none"
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <NeoButton size="sm" tone="secondary" style={{ flex: 1 }} onPress={() => router.push("/library/recent")}>Recent</NeoButton>
          <NeoButton size="sm" tone="base" style={{ flex: 1 }} onPress={() => router.push("/library/recipes")}>Recipes</NeoButton>
          <NeoButton size="sm" tone="base" style={{ flex: 1 }} onPress={() => router.push("/library/deeper")}>Deeper</NeoButton>
        </View>
      </View>

      {signedOut ? (
        <SignInPrompt body="Sign in to see the scans, recipes and insights you've saved." />
      ) : isLoading ? (
        <NeoWindow title="Loading" variant="maybe" size="sm">
          <Text variant="semibold" style={{ fontSize: 14 }}>Loading saved scans...</Text>
        </NeoWindow>
      ) : error ? (
        <NeoWindow title="Error" variant="not_vegan" size="sm" boxed>
          <Text variant="semibold" style={{ fontSize: 14 }}>Unable to load saved scans.</Text>
        </NeoWindow>
      ) : visible.length === 0 ? (
        <NeoWindow title="No saved scans yet" variant="maybe" size="sm">
          <View style={{ gap: 16 }}>
            <Text variant="semibold" style={{ fontSize: 14 }}>Save a result from the Results screen to see it here.</Text>
            <NeoButton tone="base" onPress={() => router.navigate("/")}>Run a Scan</NeoButton>
          </View>
        </NeoWindow>
      ) : (
        <ScanList records={visible} emptyNote />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink
  }
});
