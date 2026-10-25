import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, statusColors } from "@/theme";
import { Text } from "./Text";

type Props = {
  title?: string;
  children: React.ReactNode;
  variant?: keyof typeof statusColors;
  size?: "sm" | "md" | "lg";
  // Outlined, colored box. Without it the section sits straight on the
  // cream background.
  boxed?: boolean;
  style?: StyleProp<ViewStyle>;
};

const pad = { sm: 12, md: 16, lg: 20 };

export function NeoWindow({
  title,
  children,
  variant = "maybe",
  size = "md",
  boxed = false,
  style
}: Props) {
  if (!boxed) {
    return (
      <View style={style}>
        {title ? <Text variant="label" style={styles.head}>{title}</Text> : null}
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.boxWrap, style]}>
      <View style={styles.shadow} />
      <View style={[styles.box, { backgroundColor: statusColors[variant], padding: pad[size] }]}>
        {title ? (
          <Text variant="label" style={[styles.head, { color: colors.ink }]}>
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingBottom: 8 },
  boxWrap: { position: "relative", marginRight: 4, marginBottom: 4 },
  shadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: radius.lg,
    backgroundColor: colors.ink
  },
  box: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.lg }
});
