import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

type Props = TextProps & {
  variant?: "body" | "bold" | "semibold" | "display" | "label" | "small";
};

// Inter for everything, Lilita One for headlines.
export function Text({ variant = "body", style, ...rest }: Props) {
  return <RNText {...rest} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: { color: colors.ink, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  body: {},
  bold: { fontFamily: fonts.bold },
  semibold: { fontFamily: fonts.semibold },
  display: { fontFamily: fonts.display, color: colors.forest, fontSize: 28, lineHeight: 32 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.forest
  },
  small: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 }
});
