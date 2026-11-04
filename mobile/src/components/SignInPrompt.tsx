import { useRouter } from "expo-router";
import { NeoButton } from "./NeoButton";
import { NeoWindow } from "./NeoWindow";
import { Text } from "./Text";

// Shown on Library and Profile when nobody is signed in.
export function SignInPrompt({ body }: { body: string }) {
  const router = useRouter();
  return (
    <NeoWindow title="Sign in" variant="maybe" size="md">
      <Text variant="semibold" style={{ fontSize: 14, marginBottom: 16 }}>{body}</Text>
      <NeoButton tone="secondary" onPress={() => router.push("/auth")}>Sign In</NeoButton>
    </NeoWindow>
  );
}
