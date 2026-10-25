import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { colors, radius } from "@/theme";
import { NeoButton } from "./NeoButton";

type Props = { title?: string; children: React.ReactNode };

export function Expandable({ title = "Deeper", children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={{ gap: 16 }}>
      <NeoButton tone={isOpen ? "secondary" : "base"} onPress={() => setIsOpen((open) => !open)}>
        {isOpen ? `Hide ${title}` : title}
      </NeoButton>
      {isOpen ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <View style={styles.panel}>{children}</View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: 16
  }
});
