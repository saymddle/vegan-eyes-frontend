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
  // Title colour when the title is one colour.
  heading?: string;
};

// Gives each word its own brand colour, with a black drop shadow like the
// logo so every colour reads on the card.
function ColoredTitle({ text, palette }: { text: string; palette: string[] }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="[text-shadow:2px_2px_0_#20251F]">
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

// A white rounded badge holding a line icon.
function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border-2 border-[#20251F] bg-white text-[#214E34] shadow-[2px_2px_0px_#20251F]"
    >
      <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
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
    titleColors: [colors.primary, colors.white, colors.secondary],
    background: colors.alert,
    text: colors.ink
  },
  {
    label: "Scan or paste",
    title: "Scan or paste a recipe",
    body: "Snap a photo of a cookbook page or label, or paste a recipe from any website.",
    art: (
      <Glyph>
        <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </Glyph>
    ),
    background: colors.secondary,
    text: colors.ink,
    heading: colors.forest
  },
  {
    label: "Go vegan",
    title: "Get the vegan version",
    body: "Every animal ingredient gets a plant-based swap. Tap a swap to pick another or keep the original.",
    art: (
      <Glyph>
        <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8" />
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
        <path d="M6 3h12v18l-6-4-6 4z" />
      </Glyph>
    ),
    background: colors.white,
    text: colors.ink,
    heading: colors.forest
  }
];

// The swipeable intro shown on the first visit.
export default function WelcomePage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  // The whole screen takes the colour of the slide in view.
  const current = slides[index];
  const onDark = current.background === colors.forest;

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
      className="flex min-h-[calc(100dvh-58px)] flex-col px-6 pb-6 pt-2 transition-colors duration-300"
      style={{ backgroundColor: current.background, color: current.text }}
    >
      <div className="mx-auto flex w-full max-w-[500px] flex-1 flex-col gap-4">
        <div className="flex justify-end">
          {isLast ? (
            <span className="min-h-[44px]" />
          ) : (
            <button
              type="button"
              onClick={() => finish("/")}
              className="min-h-[44px] px-2 text-sm font-bold underline underline-offset-4"
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
                className="flex h-full min-h-[240px] flex-col justify-between gap-6 py-2"
                style={{ color: slide.text }}
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
                  <h1
                    className={`text-[34px] leading-[1.05] min-[400px]:text-[40px] ${
                      slide.titleColors ? "uppercase" : ""
                    }`}
                    style={slide.heading ? { color: slide.heading } : undefined}
                  >
                    {slide.titleColors ? (
                      <ColoredTitle
                        text={slide.title}
                        palette={slide.titleColors}
                      />
                    ) : (
                      slide.title
                    )}
                  </h1>
                  <p className="text-[17px] font-semibold leading-7">{slide.body}</p>
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
                className={`block h-3 border-2 border-[#20251F] transition-all ${
                  i === index ? "w-7" : "w-3"
                } rounded-xl`}
                style={{
                  backgroundColor:
                    i === index ? (onDark ? colors.leaf : colors.forest) : colors.white
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
            tone={onDark ? "secondary" : "primary"}
            className="w-full py-3 text-lg"
          >
            Next
          </NeoButton>
        )}
      </div>
    </main>
  );
}
