import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import type { SwapReportReason } from "@/lib/data";
import { colors, fonts, radius } from "@/theme";
import { NeoButton } from "./NeoButton";
import { Text } from "./Text";
import { TextLink } from "./TextLink";

const reasons: { value: SwapReportReason; label: string }[] = [
  { value: "wrong_swap", label: "The swap doesn't work in this recipe" },
  { value: "not_vegan", label: "The swap isn't vegan" },
  { value: "already_vegan", label: "This ingredient is already vegan" },
  { value: "other", label: "Something else" }
];

// A small form under a swap for telling us it is wrong.
export function ReportSwapForm({
  onSubmit
}: {
  ingredient: string;
  onSubmit: (reason: SwapReportReason, note: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SwapReportReason>("wrong_swap");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function submit() {
    setState("sending");
    try {
      await onSubmit(reason, note);
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") return <Text variant="small">Thanks. We&apos;ll review this swap.</Text>;
  if (!open) return <TextLink onPress={() => setOpen(true)} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}>Report a wrong swap</TextLink>;

  return (
    <View style={styles.form}>
      <Text variant="small">What&apos;s wrong with this swap?</Text>
      {reasons.map((option) => {
        const checked = reason === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setReason(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            style={styles.option}
          >
            <View style={[styles.radio, checked && styles.radioOn]}>{checked ? <View style={styles.dot} /> : null}</View>
            <Text style={{ fontSize: 14, flex: 1 }}>{option.label}</Text>
          </Pressable>
        );
      })}
      <TextInput
        value={note}
        onChangeText={setNote}
        maxLength={500}
        multiline
        placeholder="Optional: what would you use instead?"
        placeholderTextColor={colors.muted}
        style={styles.note}
      />
      {state === "failed" ? (
        <Text variant="small" style={{ color: colors.tomato }}>Couldn&apos;t send the report. Try again.</Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <NeoButton size="sm" tone="primary" disabled={state === "sending"} onPress={() => void submit()}>
          {state === "sending" ? "Sending..." : "Send report"}
        </NeoButton>
        <TextLink onPress={() => setOpen(false)}>Cancel</TextLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8, borderTopWidth: 2, borderTopColor: colors.ink, paddingTop: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  radioOn: { borderColor: colors.forest },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  note: {
    minHeight: 64,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    padding: 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
    textAlignVertical: "top"
  }
});
