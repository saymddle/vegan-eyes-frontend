import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./Text";

// A labelled text box, like the website's form fields.
export function Field({ label, style, ...rest }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text variant="bold" style={{ fontSize: 12, lineHeight: 16 }}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} {...rest} style={[styles.input, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink
  }
});
