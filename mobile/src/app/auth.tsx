import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Field } from "@/components/Field";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { TextLink } from "@/components/TextLink";
import { API_BASE } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { colors, radius } from "@/theme";

type Mode = "sign_in" | "sign_up";

// Sign in or create an account. Opens over the current screen and closes
// back to it once signed in, like the website's ?next= return.
export default function AuthScreen() {
  const router = useRouter();
  const session = useSession();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const justSignedIn = useRef(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && !justSignedIn.current) {
        justSignedIn.current = true;
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function handleSubmit() {
    setIsBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "sign_in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) {
          setError(
            signInError.message === "Email not confirmed"
              ? "Confirm your email first. Check your inbox for the link."
              : "That email and password don't match."
          );
        }
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${API_BASE}/auth` }
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setNotice("Check your email and tap the link to finish signing up. Then come back and sign in.");
        setMode("sign_in");
      }
    } finally {
      setIsBusy(false);
    }
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (session && !justSignedIn.current) {
    return (
      <Screen header={false} back="Close" edges={["top", "bottom"]}>
        <NeoWindow title="Account" variant="vegan" size="lg">
          <View style={{ gap: 16 }}>
            <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>Signed in.</Text>
            <Text variant="semibold" style={{ fontSize: 14 }}>{session.user.email}</Text>
            <NeoButton
              tone="base"
              onPress={() => {
                router.dismissAll();
                router.navigate("/");
              }}
            >
              Back to Scan
            </NeoButton>
            <NeoButton tone="danger" onPress={() => void supabase.auth.signOut()}>Sign Out</NeoButton>
          </View>
        </NeoWindow>
      </Screen>
    );
  }

  const ready = email.trim().length > 3 && password.length >= 6;

  return (
    <Screen header={false} edges={["top", "bottom"]}>
      <TextLink onPress={close} color={colors.forest} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}>
        Close
      </TextLink>
      <NeoWindow title={mode === "sign_in" ? "Sign In" : "Create Account"} variant="vegan" size="lg">
        <View style={{ gap: 16 }}>
          <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>
            {mode === "sign_in" ? "Welcome back." : "Join Vegan Eyes."}
          </Text>
          <Text>
            Sign in to save your vegan recipes and scans.{" "}
            <Text
              style={{ textDecorationLine: "underline" }}
              onPress={() => router.push("/privacy")}
              accessibilityRole="link"
            >
              How we use your data
            </Text>
          </Text>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
            textContentType={mode === "sign_in" ? "password" : "newPassword"}
            onSubmitEditing={() => ready && void handleSubmit()}
          />
          {error ? (
            <View style={[styles.message, { backgroundColor: colors.tomato }]} accessibilityRole="alert">
              <Text variant="semibold" style={{ fontSize: 14, color: colors.white }}>{error}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={[styles.message, { backgroundColor: colors.butter }]}>
              <Text variant="semibold" style={{ fontSize: 14 }}>{notice}</Text>
            </View>
          ) : null}
          <NeoButton tone="secondary" disabled={isBusy || !ready} onPress={() => void handleSubmit()}>
            {isBusy ? "One moment..." : mode === "sign_in" ? "Sign In" : "Create Account"}
          </NeoButton>
          <TextLink
            onPress={() => {
              setMode(mode === "sign_in" ? "sign_up" : "sign_in");
              setError("");
            }}
            style={{ alignSelf: "center" }}
          >
            {mode === "sign_in" ? "New here? Create an account" : "Have an account? Sign in"}
          </TextLink>
        </View>
      </NeoWindow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.md, padding: 12 }
});
