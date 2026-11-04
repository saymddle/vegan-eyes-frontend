import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Field } from "@/components/Field";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { TextLink } from "@/components/TextLink";
import { getProfile, getRecipes, getScans, saveProfile, type Profile, type SavedRecipe, type SavedScan } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAccountData } from "@/lib/useAccountData";
import { useSession } from "@/lib/useSession";
import { colors } from "@/theme";

type Loaded = { scans: SavedScan[]; recipes: SavedRecipe[]; profile: Profile };

// The ingredients swapped most often across saved recipes.
function topSwaps(recipes: SavedRecipe[]) {
  const counts = new Map<string, number>();
  recipes.forEach(({ recipe }) =>
    recipe.swaps
      .filter((swap) => swap.replacement)
      .forEach((swap) => {
        const name = swap.ingredient.toLowerCase();
        counts.set(name, (counts.get(name) ?? 0) + 1);
      })
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

async function loadAll(): Promise<Loaded> {
  const [scans, recipes, profile] = await Promise.all([getScans(), getRecipes(), getProfile()]);
  return { scans, recipes, profile };
}

export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const { data, setData, signedOut } = useAccountData<Loaded>(loadAll, {
    scans: [],
    recipes: [],
    profile: { displayName: "", bio: "" }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const email = session?.user.email ?? null;
  const { scans, recipes, profile } = data;
  const mostSwapped = topSwaps(recipes);
  const swapCount = recipes.reduce((total, { recipe }) => total + recipe.swaps.filter((swap) => swap.replacement).length, 0);

  async function handleSaveProfile() {
    setIsSaving(true);
    setSaveError("");
    try {
      await saveProfile({ displayName, bio });
      setData((current) => ({ ...current, profile: { displayName: displayName.trim(), bio: bio.trim() } }));
      setIsEditing(false);
    } catch {
      setSaveError("Could not save your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (signedOut) {
    return (
      <Screen>
        <SignInPrompt body="Sign in to see your profile, your stats and your account settings." />
        <TextLink onPress={() => router.push("/privacy")} style={{ alignSelf: "center" }}>Privacy</TextLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={styles.avatar} />
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="display" style={{ fontSize: 24, lineHeight: 28 }}>
              {profile.displayName || (email ? email.split("@")[0] : "Guest")}
            </Text>
            <Text variant="semibold" style={{ fontSize: 14 }}>{email ?? "Your account"}</Text>
          </View>
        </View>
        {profile.bio ? <Text variant="semibold" style={{ fontSize: 14, lineHeight: 24, marginTop: 16 }}>{profile.bio}</Text> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        {(
          [
            ["Scans", scans.length],
            ["Recipes", recipes.length],
            ["Swaps", swapCount]
          ] as const
        ).map(([label, count]) => (
          <NeoWindow key={label} title={label} size="sm" style={{ flex: 1 }}>
            <Text variant="semibold" style={{ fontSize: 36, lineHeight: 42 }}>{count}</Text>
          </NeoWindow>
        ))}
      </View>

      <NeoWindow title="Most Swapped" size="md">
        {mostSwapped.length ? (
          <View style={{ gap: 8 }}>
            {mostSwapped.map(([name, count]) => (
              <View key={name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="bold" style={{ fontSize: 14 }}>{name}</Text>
                <Text variant="bold" style={{ fontSize: 14 }}>{count}x</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="semibold" style={{ fontSize: 14 }}>Save a converted recipe to see what you swap most.</Text>
        )}
      </NeoWindow>

      <NeoWindow title="Edit Profile" size="md">
        {isEditing ? (
          <View style={{ gap: 16 }}>
            <Field label="Display name" value={displayName} maxLength={40} onChangeText={setDisplayName} />
            <Field
              label="Bio"
              value={bio}
              maxLength={200}
              multiline
              onChangeText={setBio}
              style={{ minHeight: 88, textAlignVertical: "top" }}
            />
            {saveError ? <Text variant="semibold" style={{ fontSize: 14 }}>{saveError}</Text> : null}
            <NeoButton tone="secondary" disabled={isSaving} onPress={() => void handleSaveProfile()}>
              {isSaving ? "Saving..." : "Save Profile"}
            </NeoButton>
          </View>
        ) : (
          <NeoButton
            tone="base"
            onPress={() => {
              setDisplayName(profile.displayName);
              setBio(profile.bio);
              setIsEditing(true);
            }}
          >
            Edit Name and Bio
          </NeoButton>
        )}
      </NeoWindow>

      <NeoButton tone="base" onPress={() => router.navigate("/library")}>Your Library</NeoButton>
      <NeoButton
        tone="danger"
        onPress={() => {
          void supabase.auth.signOut();
          router.navigate("/");
        }}
      >
        Sign Out
      </NeoButton>
      <View style={{ alignItems: "center" }}>
        <TextLink onPress={() => router.push("/profile/delete")}>Delete account</TextLink>
        <TextLink onPress={() => router.push("/privacy")}>Privacy</TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.cream }
});
