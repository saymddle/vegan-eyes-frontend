import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";
import { Text } from "./Text";

// An underlined text button, like the website's small links.
export function TextLink({
  children,
  onPress,
  size = 14,
  color = colors.ink,
  style
}: {
  children: string;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }, style]}>
      <Text variant="bold" style={{ fontSize: size, color, textDecorationLine: "underline" }}>{children}</Text>
    </Pressable>
  );
}
