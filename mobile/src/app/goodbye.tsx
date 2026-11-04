import { useRouter } from "expo-router";
import { NeoButton } from "@/components/NeoButton";
import { NeoWindow } from "@/components/NeoWindow";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";

export default function GoodbyeScreen() {
  const router = useRouter();
  return (
    <Screen header={false} edges={["top", "bottom"]}>
      <NeoWindow title="Account deleted" variant="vegan" size="lg">
        <Text variant="display" style={{ fontSize: 36, lineHeight: 40 }}>We miss you already!</Text>
      </NeoWindow>
      <NeoButton size="lg" tone="secondary" onPress={() => router.replace("/auth")}>Home</NeoButton>
    </Screen>
  );
}
