import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { NeoButton } from "@/components/NeoButton";
import { Text } from "@/components/Text";
import { INTRO_SEEN, RESULTS_TOUR_SEEN, SCAN_TOUR_SEEN, clearFlag, setFlag } from "@/lib/onboarding";
import { colors, fonts } from "@/theme";

type Slide = {
  label: string;
  title: string;
  body: string;
  art: React.ReactNode;
  // The art fills the free space, centred (the welcome logo).
  hero?: boolean;
  // Each word of the title gets the next colour (the welcome title).
  titleColors?: string[];
  background: string;
  text: string;
  // Title colour when the title is one colour.
  heading?: string;
};

// A white rounded badge holding a line icon.
function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.glyph}>
      <Svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke={colors.forest} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </Svg>
    </View>
  );
}

const slides: Slide[] = [
  {
    label: "Welcome",
    title: "Substitute your usual",
    body: "Vegan Eyes spots the animal ingredients in any recipe or food label.",
    art: <Image source={require("../../assets/images/welcome-logo.png")} style={{ width: 200, height: 200 }} />,
    hero: true,
    titleColors: [colors.forest, colors.white, colors.butter],
    background: colors.tomato,
    text: colors.ink
  },
  {
    label: "Scan or paste",
    title: "Scan or paste a recipe",
    body: "Snap a photo of a cookbook page or label, or paste a recipe from any website.",
    art: (
      <Glyph>
        <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
        <Circle cx="12" cy="13" r="3.5" />
      </Glyph>
    ),
    background: colors.butter,
    text: colors.ink,
    heading: colors.forest
  },
  {
    label: "Go vegan",
    title: "Get the vegan version",
    body: "Every animal ingredient gets a plant-based swap. Tap a swap to pick another or keep the original.",
    art: (
      <Glyph>
        <Path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8" />
      </Glyph>
    ),
    background: colors.forest,
    text: colors.cream,
    heading: colors.leaf
  },
  {
    label: "Save",
    title: "Keep your favourites",
    body: "Make a free account to save recipes to your Library, then copy, share or print them.",
    art: (
      <Glyph>
        <Path d="M6 3h12v18l-6-4-6 4z" />
      </Glyph>
    ),
    background: colors.white,
    text: colors.ink,
    heading: colors.forest
  }
];

// Each word in its own brand colour, with a hard ink shadow like the logo.
function ColoredTitle({ text, palette }: { text: string; palette: string[] }) {
  return (
    <Text accessibilityLabel={text} style={[styles.title, styles.upper]}>
      {text.split(" ").map((word, i) => (
        <Text key={i} style={[styles.title, styles.upper, styles.inkShadow, { color: palette[i % palette.length] }]}>
          {i > 0 ? " " : ""}
          {word}
        </Text>
      ))}
    </Text>
  );
}

// The swipeable intro shown the first time the app opens.
export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const finished = useRef(false);
  const isLast = index === slides.length - 1;
  const onDark = slides[index].background === colors.forest;

  // The whole screen fades into the colour of the slide in view.
  const onScroll = useAnimatedScrollHandler((event) => {
    offset.value = event.contentOffset.x;
  });
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      offset.value,
      slides.map((_, i) => i * width),
      slides.map((slide) => slide.background)
    )
  }));

  function goTo(next: number) {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  // Finishing the intro also replays the first-scan walkthrough.
  function finish(signIn: boolean) {
    if (finished.current) return;
    finished.current = true;
    setFlag(INTRO_SEEN);
    clearFlag(SCAN_TOUR_SEEN);
    clearFlag(RESULTS_TOUR_SEEN);
    if (router.canGoBack()) router.dismissTo("/");
    else router.replace("/");
    if (signIn) router.push("/auth");
  }

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <StatusBar style={onDark ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.top}>
          {isLast ? null : (
            <Pressable onPress={() => finish(false)} style={styles.skip} accessibilityRole="button">
              <Text variant="bold" style={{ fontSize: 14, textDecorationLine: "underline", color: slides[index].text }}>
                Skip
              </Text>
            </Pressable>
          )}
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          accessibilityLabel="Intro to Vegan Eyes"
          style={{ flex: 1 }}
        >
          {slides.map((slide, i) => (
            <View
              key={slide.label}
              style={[styles.slide, { width }]}
              accessibilityLabel={`${i + 1} of ${slides.length}: ${slide.label}`}
              importantForAccessibility={i === index ? "auto" : "no-hide-descendants"}
              accessibilityElementsHidden={i !== index}
            >
              {slide.hero ? (
                <View style={styles.hero}>{slide.art}</View>
              ) : (
                <View style={styles.art}>{slide.art}</View>
              )}
              <View style={{ gap: 16 }}>
                {slide.titleColors ? (
                  <ColoredTitle text={slide.title} palette={slide.titleColors} />
                ) : (
                  <Text accessibilityRole="header" style={[styles.title, { color: slide.heading ?? slide.text }]}>
                    {slide.title}
                  </Text>
                )}
                <Text variant="semibold" style={{ fontSize: 17, lineHeight: 28, color: slide.text }}>{slide.body}</Text>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots} accessibilityRole="tablist">
            {slides.map((slide, i) => {
              const active = i === index;
              return (
                <Pressable
                  key={slide.label}
                  onPress={() => goTo(i)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Go to ${slide.label}`}
                  style={styles.dotHit}
                >
                  <View
                    style={[
                      styles.dot,
                      active && { width: 28 },
                      { backgroundColor: active ? (onDark ? colors.leaf : colors.forest) : colors.white }
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          {isLast ? (
            <View style={{ gap: 12 }}>
              <NeoButton size="lg" onPress={() => finish(false)}>Start scanning</NeoButton>
              <NeoButton tone="base" onPress={() => finish(true)}>Sign in or sign up</NeoButton>
            </View>
          ) : (
            <NeoButton size="lg" tone={onDark ? "secondary" : "primary"} onPress={() => goTo(index + 1)}>
              Next
            </NeoButton>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { height: 52, paddingHorizontal: 16, alignItems: "flex-end", justifyContent: "center" },
  skip: { minHeight: 44, paddingHorizontal: 8, justifyContent: "center" },
  slide: { paddingHorizontal: 24, paddingBottom: 12, justifyContent: "space-between", gap: 24 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  art: { height: 112, justifyContent: "center" },
  glyph: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `2px 2px 0px ${colors.ink}`
  },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42 },
  upper: { textTransform: "uppercase" },
  inkShadow: { textShadowColor: colors.ink, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0.1 },
  bottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 16 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4 },
  dotHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 12, height: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.ink }
});
