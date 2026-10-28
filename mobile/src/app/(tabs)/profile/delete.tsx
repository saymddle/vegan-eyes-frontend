import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Field } from "@/components/Field";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { DELETE_PHRASE, deleteMyAccount, matchesDeletePhrase } from "@/lib/data";
import { colors, radius } from "@/theme";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const ready = matchesDeletePhrase(phrase);

  async function handleDelete() {
    if (!ready || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteMyAccount();
      router.dismissAll();
      router.replace("/goodbye");
    } catch {
      setError("We couldn't delete your account. Try again in a moment.");
      setIsDeleting(false);
    }
  }

  return (
    <Screen header={false} back="Profile">
      <NeoWindow title="Delete account" variant="not_vegan" size="lg">
        <View style={{ gap: 16 }}>
          <Text variant="display" style={{ fontSize: 34, lineHeight: 38 }}>Leaving Vegan Eyes?</Text>
          <Text style={{ lineHeight: 24 }}>
            This deletes your account and everything saved with it: your recipes, scans, notes and profile. It
            can&apos;t be undone.
          </Text>
          <Field
            label={`Type “${DELETE_PHRASE}” to confirm`}
            value={phrase}
            onChangeText={setPhrase}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder={DELETE_PHRASE}
          />
          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <Text variant="semibold" style={{ fontSize: 14 }}>{error}</Text>
            </View>
          ) : null}
          <NeoButton tone="danger" disabled={!ready || isDeleting} onPress={() => void handleDelete()}>
            {isDeleting ? "Deleting..." : "Delete my account"}
          </NeoButton>
        </View>
      </NeoWindow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.md, padding: 12, backgroundColor: colors.white }
});
