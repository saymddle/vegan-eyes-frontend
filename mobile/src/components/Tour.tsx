import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type HostInstance,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { hasFlag, setFlag } from "@/lib/onboarding";
import { colors, radius } from "@/theme";
import { Text } from "./Text";

export type TourStep = {
  // Matches a <TourTarget name="..."> on the screen.
  target: string;
  title: string;
  body: string;
  extra?: React.ReactNode;
};

type Box = { top: number; left: number; width: number; height: number };

const PAD = 6;
const GAP = 14;

type Registry = { register: (name: string, view: HostInstance | null) => void };
const TourContext = createContext<Registry>({ register: () => {} });

// Marks a control the walkthrough can point at.
export function TourTarget({
  name,
  children,
  style
}: {
  name: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { register } = useContext(TourContext);
  return (
    <View ref={(view) => register(name, view)} collapsable={false} style={style}>
      {children}
    </View>
  );
}

type Props = {
  steps: TourStep[];
  // Remembers that this walkthrough was seen.
  storageKey: string;
  // Waits for this target before starting, e.g. content that loads later.
  waitFor?: string;
  // Only starts while this is true (the screen is in view).
  enabled?: boolean;
  scrollRef: React.RefObject<ScrollViewInstance | null>;
  contentRef: React.RefObject<HostInstance | null>;
  children: React.ReactNode;
};

// A short guided tour: dims the screen, outlines one control at a time and
// explains it in a card beside it. Shown once per phone, like the website's.
export function Tour({ steps, storageKey, waitFor, enabled = true, scrollRef, contentRef, children }: Props) {
  const views = useRef(new Map<string, HostInstance>());
  const registry = useMemo<Registry>(
    () => ({
      register: (name, view) => {
        if (view) views.current.set(name, view);
        else views.current.delete(name);
      }
    }),
    []
  );
  const [active, setActive] = useState<TourStep[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [tipHeight, setTipHeight] = useState(0);
  const { width: viewWidth, height: viewHeight } = useWindowDimensions();

  // Start once the screen is ready and the tour hasn't been seen.
  useEffect(() => {
    if (!enabled || active || hasFlag(storageKey)) return;
    const first = waitFor ?? steps[0].target;
    const timer = setInterval(() => {
      if (!views.current.has(first)) return;
      clearInterval(timer);
      const present = steps.filter((step) => views.current.has(step.target));
      if (present.length) {
        setStepIndex(0);
        setActive(present);
      }
    }, 300);
    return () => clearInterval(timer);
  }, [enabled, active, storageKey, steps, waitFor]);

  const step = active?.[stepIndex];

  const measure = useCallback(() => {
    if (!step) return;
    views.current.get(step.target)?.measureInWindow((x, y, w, h) => {
      if (!w && !h) return;
      setBox({ top: y - PAD, left: x - PAD, width: w + PAD * 2, height: h + PAD * 2 });
    });
  }, [step]);

  // Scrolls the control into the middle of the screen, then outlines it.
  // Keeps measuring while open, since a tap in the card can change the
  // layout (Try a sample recipe switches to Type).
  useEffect(() => {
    if (!step) return;
    const view = views.current.get(step.target);
    const content = contentRef.current;
    if (view && content) {
      view.measureLayout(content, (_x, y, _w, h) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - (viewHeight - h) / 2), animated: true });
      });
    }
    const settle = setTimeout(measure, 400);
    const keep = setInterval(measure, 500);
    return () => {
      clearTimeout(settle);
      clearInterval(keep);
    };
  }, [step, measure, scrollRef, contentRef, viewHeight]);

  function finish() {
    setFlag(storageKey);
    setActive(null);
    setBox(null);
  }

  // Leaving the screen ends the tour without marking it seen.
  useEffect(() => {
    if (!enabled && active) {
      setActive(null);
      setBox(null);
    }
  }, [enabled, active]);

  const showing = Boolean(active && step && box);
  const isLast = active ? stepIndex === active.length - 1 : false;
  const tipWidth = Math.min(340, viewWidth - 32);
  let top = 0;
  let left = 16;
  if (box) {
    left = Math.min(Math.max(16, box.left + box.width / 2 - tipWidth / 2), viewWidth - tipWidth - 16);
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - tipHeight;
    // Below the control, else above it, else over its lower edge.
    top =
      below + tipHeight <= viewHeight - 16 ? below : above >= 16 ? above : Math.max(16, viewHeight - tipHeight - 16);
  }

  return (
    <TourContext.Provider value={registry}>
      {children}
      <Modal visible={showing} transparent animationType="fade" statusBarTranslucent onRequestClose={finish}>
        {box && step ? (
          <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
            {/* Four dim panels around the outlined control; taps on them do nothing. */}
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, box.top) }]} />
            <View style={[styles.dim, { top: box.top + box.height, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.dim, { top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }]} />
            <View style={[styles.dim, { top: box.top, left: box.left + box.width, right: 0, height: box.height }]} />
            <View pointerEvents="none" style={[styles.ring, box]} />
            {/* Blocks taps on the outlined control too. */}
            <View style={[box, { position: "absolute" }]} />

            <Animated.View
              key={stepIndex}
              entering={FadeIn.duration(180)}
              onLayout={(event) => setTipHeight(event.nativeEvent.layout.height)}
              accessibilityRole="alert"
              style={[styles.tip, { top, left, width: tipWidth }]}
            >
              <Text variant="label" style={{ fontSize: 12 }}>
                Step {stepIndex + 1} of {active!.length}
              </Text>
              <Text variant="display" style={{ fontSize: 22, lineHeight: 26, color: colors.ink, marginTop: 4 }}>
                {step.title}
              </Text>
              <Text variant="semibold" style={{ fontSize: 14, lineHeight: 22, marginTop: 8 }}>{step.body}</Text>
              {step.extra ? <View style={{ marginTop: 12 }}>{step.extra}</View> : null}
              <View style={styles.row}>
                {isLast ? (
                  <View />
                ) : (
                  <Pressable onPress={finish} style={styles.skip} accessibilityRole="button">
                    <Text variant="bold" style={{ fontSize: 14, textDecorationLine: "underline" }}>Skip tour</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => (isLast ? finish() : setStepIndex((current) => current + 1))}
                  accessibilityRole="button"
                  style={styles.next}
                >
                  <Text variant="bold" style={{ fontSize: 14, color: colors.white }}>{isLast ? "Got it" : "Next"}</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        ) : null}
      </Modal>
    </TourContext.Provider>
  );
}

// The yellow "Try a sample recipe" style button used inside a tour card.
export function TourAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.action}>
      <Text variant="bold" style={{ fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    outlineWidth: 4,
    outlineColor: colors.butter,
    outlineStyle: "solid"
  },
  tip: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 20,
    boxShadow: `4px 4px 0px ${colors.ink}`
  },
  row: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  skip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  next: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
    justifyContent: "center",
    boxShadow: `3px 3px 0px ${colors.ink}`
  },
  action: {
    minHeight: 44,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.butter,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  }
});
