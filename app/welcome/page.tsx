"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import {
  INTRO_SEEN,
  RESULTS_TOUR_SEEN,
  SCAN_TOUR_SEEN,
  clearFlag,
  setFlag
} from "@/lib/onboarding/flags";
import { colors } from "@/lib/theme/colors";

type Slide = {
  label: string;
  title: string;
  body: string;
  art: React.ReactNode;
  // The art fills the card's free space, centred (the welcome logo).
  hero?: boolean;
  // Each word of the title gets the next colour (the welcome title).
  titleColors?: string[];
  background: string;
  text: string;
};

// Gives each word its own brand colour, with a black drop shadow like the
// logo so every colour reads on the card.
function ColoredTitle({ text, palette }: { text: string; palette: string[] }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="[text-shadow:2px_2px_0_#000]">
        {text.split(" ").map((word, i) => (
          <span key={i} style={{ color: palette[i % palette.length] }}>
            {i > 0 ? " " : ""}
            {word}
          </span>
        ))}
      </span>
    </>
  );
}

function Glyph({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="text-6xl leading-none min-[400px]:text-7xl"
    >
      {children}
    </span>
  );
}

const slides: Slide[] = [
  {
    label: "Welcome",
    title: "Substitute your usual",
    body: "Vegan Eyes spots the animal ingredients in any recipe or food label.",
    art: (
      <Image
        src="/icon-512.png"
        alt=""
        width={224}
        height={224}
        priority
        className="h-40 w-40 min-[400px]:h-56 min-[400px]:w-56 [@media(max-height:640px)]:h-28 [@media(max-height:640px)]:w-28"
      />
    ),
    hero: true,
    titleColors: [colors.primary, colors.white, colors.alert],
    background: colors.alert,
    text: colors.white
  },
  {
    label: "Scan or paste",
    title: "Scan or paste a recipe",
    body: "Snap a photo of a cookbook page or label, or paste a recipe from any website.",
    art: <Glyph>📷</Glyph>,
    background: colors.secondary,
    text: colors.black
  },
  {
    label: "Go vegan",
    title: "Get the vegan version",
    body: "Every animal ingredient gets a plant-based swap. Tap a swap to pick another or keep the original.",
    art: <Glyph>🌱</Glyph>,
    background: colors.alert,
    text: colors.white
  },
  {
    label: "Save",
    title: "Keep your favourites",
    body: "Make a free account to save recipes to your Library, then copy, share or print them.",
    art: <Glyph>📚</Glyph>,
    background: colors.white,
    text: colors.black
  }
];

// The swipeable intro shown on the first visit.
export default function WelcomePage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  // Finishing the intro also replays the first-scan walkthrough.
  function finish(destination: string) {
    setFlag(INTRO_SEEN);
    clearFlag(SCAN_TOUR_SEEN);
    clearFlag(RESULTS_TOUR_SEEN);
    router.replace(destination);
  }

  return (
    <main
      className="flex min-h-[calc(100dvh-59px)] flex-col px-6 pb-6 pt-2"
      style={{ backgroundColor: colors.base }}
    >
      <div className="mx-auto flex w-full max-w-[500px] flex-1 flex-col gap-4">
        <div className="flex justify-end">
          {isLast ? (
            <span className="min-h-[44px]" />
          ) : (
            <button
              type="button"
              onClick={() => finish("/")}
              className="min-h-[44px] px-2 text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4"
            >
              Skip
            </button>
          )}
        </div>

        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="-mx-6 flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carousel"
          aria-label="Intro to Vegan Eyes"
        >
          {slides.map((slide, i) => (
            <section
              key={slide.label}
              className="w-full shrink-0 snap-center px-6 pb-3"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${slide.label}`}
              aria-hidden={i !== index}
            >
              <div
                className="flex h-full min-h-[240px] flex-col justify-between gap-6 border-[3px] border-[#000000] p-6 shadow-[8px_8px_0px_#000000]"
                style={{ backgroundColor: slide.background, color: slide.text }}
              >
                {slide.hero ? (
                  <div className="flex flex-1 items-center justify-center">
                    {slide.art}
                  </div>
                ) : (
                  <div className="flex h-20 items-center min-[400px]:h-28 [@media(max-height:640px)]:hidden">
                    {slide.art}
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <h1 className="text-3xl font-black uppercase leading-[0.95] min-[400px]:text-4xl tracking-[-0.04em]">
                    {slide.titleColors ? (
                      <ColoredTitle
                        text={slide.title}
                        palette={slide.titleColors}
                      />
                    ) : (
                      slide.title
                    )}
                  </h1>
                  <p className="text-base font-bold leading-7">{slide.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="flex justify-center gap-1" role="tablist">
          {slides.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to ${slide.label}`}
              onClick={() => goTo(i)}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`block h-3 border-2 border-[#000000] transition-all ${
                  i === index ? "w-7" : "w-3"
                }`}
                style={{
                  backgroundColor: i === index ? colors.black : colors.white
                }}
              />
            </button>
          ))}
        </div>

        {isLast ? (
          <div className="flex flex-col gap-3">
            <NeoButton
              onClick={() => finish("/")}
              className="w-full py-3 text-lg"
            >
              Start scanning
            </NeoButton>
            <NeoButton
              onClick={() => finish("/auth")}
              tone="base"
              className="w-full"
            >
              Sign in or sign up
            </NeoButton>
          </div>
        ) : (
          <NeoButton
            onClick={() => goTo(index + 1)}
            tone="secondary"
            className="w-full py-3 text-lg"
          >
            Next
          </NeoButton>
        )}
      </div>
    </main>
  );
}
