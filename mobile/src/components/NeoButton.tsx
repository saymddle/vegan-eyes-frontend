import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { colors, radius } from "@/theme";
import { Text } from "./Text";

const tones = {
  primary: { bg: colors.forest, fg: colors.cream },
  secondary: { bg: colors.butter, fg: colors.ink },
  danger: { bg: colors.tomato, fg: colors.ink },
  base: { bg: colors.white, fg: colors.ink }
};

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  tone?: keyof typeof tones;
  size?: "md" | "lg" | "sm";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// The outlined button with a hard ink shadow. Pressing slides it into its
// shadow, like the website's buttons did on click.
export function NeoButton({
  children,
  onPress,
  disabled = false,
  tone = "primary",
  size = "md",
  style,
  accessibilityLabel
}: Props) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: pressed.value * 2 }, { translateY: pressed.value * 2 }]
  }));
  const t = tones[tone];

  return (
    <View style={[styles.wrap, style, disabled && styles.disabled]}>
      {!disabled ? <View style={styles.shadow} /> : null}
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={() => (pressed.value = withTiming(1, { duration: 80 }))}
        onPressOut={() => (pressed.value = withTiming(0, { duration: 120 }))}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        <Animated.View
          style={[
            styles.button,
            size === "lg" && styles.lg,
            size === "sm" && styles.sm,
            { backgroundColor: t.bg },
            animated
          ]}
        >
          {typeof children === "string" ? (
            <Text variant="bold" style={[{ color: t.fg }, size === "lg" && { fontSize: 18 }, size === "sm" && { fontSize: 13 }]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  shadow: {
    position: "absolute",
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    borderRadius: radius.md,
    backgroundColor: colors.ink
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  lg: { minHeight: 56 },
  sm: { minHeight: 44, paddingHorizontal: 8 },
  disabled: { opacity: 0.5 }
});
