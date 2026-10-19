"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import Walkthrough, {
  type WalkthroughStep
} from "@/components/features/Walkthrough";
import WelcomeCard from "@/components/features/WelcomeCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoSwitch from "@/components/ui/NeoSwitch";
import NeoWindow from "@/components/ui/NeoWindow";
import { INTRO_SEEN, SCAN_TOUR_SEEN, hasFlag } from "@/lib/onboarding/flags";
import { storeScanInput } from "@/lib/store/recipeInput";
import { colors } from "@/lib/theme/colors";
import type { Ingredient } from "@/lib/utils/ocrIngredients";

// The scan heading alternates between these, 5 seconds each.
const messages = ["SCAN AN INGREDIENT", "CONVERT A RECIPE"];

// Filled in by "Try a sample recipe" in the first-scan walkthrough.
const SAMPLE_RECIPE = `Fluffy Pancakes
1 cup flour
1 tbsp sugar
2 tsp baking powder
1 cup milk
1 egg
2 tbsp melted butter
Honey, to serve`;

export default function Home() {
  const router = useRouter();
  const webcamRef = useRef<Webcam | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [typedIngredients, setTypedIngredients] = useState("");
  const [mode, setMode] = useState<"scan" | "type">("scan");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [scanError, setScanError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  // First visit goes to the intro; null until checked in the browser.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = hasFlag(INTRO_SEEN);
    setIntroSeen(seen);
    if (!seen) router.replace("/welcome");
  }, [router]);

  const tourSteps = useMemo<WalkthroughStep[]>(
    () => [
      {
        target: "mode-switch",
        title: "Scan or type",
        body: "Scan takes a photo of a recipe or food label. Type lets you paste a recipe from a website."
      },
      {
        target: "scan-input",
        title: "Add your recipe",
        body: "Point your camera and tap Capture, or paste the recipe here. No recipe handy?",
        extra: (
          <button
            type="button"
            onClick={() => {
              setMode("type");
              setTypedIngredients(SAMPLE_RECIPE);
            }}
            className="min-h-[44px] w-full border-[3px] border-[#000000] px-3 text-xs font-black uppercase tracking-[0.08em]"
            style={{ backgroundColor: colors.secondary, color: colors.black }}
          >
            Try a sample recipe
          </button>
        )
      },
      {
        target: "analyze",
        title: "Tap Analyze",
        body: "Vegan Eyes finds every animal ingredient and gives you a plant-based version of the recipe."
      }
    ],
    []
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setVisible(false);

      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 200);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const handleCapture = () => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      return;
    }

    setImage(screenshot);
  };

  async function handleScan(imageBase64: string) {
    setLoading(true);
    setScanError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageBase64 })
      });

      const data = (await res.json()) as {
        ingredients?: Ingredient[];
        raw?: string;
      };

      setIngredients(data.ingredients ?? []);
      setRawText(data.raw ?? "");

      if (!res.ok || !data.raw?.trim()) {
        setScanError("Couldn't read any text. Try a closer, brighter photo.");
        return;
      }

      storeScanInput(data.raw, "photo");
      router.push("/results");
    } catch {
      setScanError("Scan failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleAnalyze = async () => {
    if (mode === "type") {
      setIsLoading(true);
      storeScanInput(typedIngredients.trim(), "paste");
      router.push("/results");
      return;
    }

    if (!image) {
      return;
    }

    await handleScan(image);
  };

  // Keeps the camera off until we know this isn't a first visit.
  if (!introSeen) {
    return (
      <main className="app-shell" style={{ backgroundColor: colors.primary }} />
    );
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.primary }}>
      <Walkthrough steps={tourSteps} storageKey={SCAN_TOUR_SEEN} />
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow
          title="Scan"
          variant="vegan"
          size="lg"
          headerAction={
            <button
              type="button"
              onClick={() => setShowHelp((open) => !open)}
              aria-expanded={showHelp}
              aria-controls="how-it-works"
              aria-label="How Vegan Eyes works"
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#000000] text-base font-black"
              style={{
                backgroundColor: showHelp ? colors.black : colors.white,
                color: showHelp ? colors.white : colors.black
              }}
            >
              ?
            </button>
          }
        >
          <div className="flex flex-col gap-6">
            {showHelp ? (
              <WelcomeCard onClose={() => setShowHelp(false)} />
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex h-[80px] max-w-[260px] items-end">
                <h1
                  className={`text-4xl font-black uppercase leading-tight tracking-[-0.05em] transition-opacity duration-200 ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {messages[index]}
                </h1>
              </div>
              <NeoSwitch value={mode} onChange={setMode} tour="mode-switch" />
            </div>

            <div
              data-tour="scan-input"
              className="border-[3px] border-[#000000] p-4 shadow-[8px_8px_0px_#000000]"
              style={{
                backgroundColor: colors.white,
                color: colors.black
              }}
            >
              {mode === "scan" ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                  {image ? (
                    <img
                      src={image}
                      alt="Captured ingredient label"
                      className="h-full max-h-[260px] w-full rounded border-[3px] border-[#000000] object-cover"
                    />
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      audio={false}
                      videoConstraints={{
                        facingMode: "environment"
                      }}
                      className="h-full max-h-[260px] w-full rounded border-[3px] border-[#000000] object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={image ? () => setImage(null) : handleCapture}
                    className="border-[3px] border-[#000000] bg-[#f8f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] shadow-[4px_4px_0px_#000000]"
                  >
                    {image ? "Retake" : "Capture"}
                  </button>
                </div>
              ) : (
                <textarea
                  value={typedIngredients}
                  onChange={(event) => setTypedIngredients(event.target.value)}
                  rows={9}
                  placeholder="Paste a recipe or type ingredients: 2 eggs, 1 cup milk, butter..."
                  className="min-h-[220px] w-full resize-none bg-transparent text-base font-black uppercase leading-7 tracking-[0.04em] outline-none placeholder:text-[#474238]/40"
                />
              )}
            </div>

            {scanError ? (
              <NeoWindow title="Scan Error" variant="not_vegan" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  {scanError}
                </p>
              </NeoWindow>
            ) : null}

            {mode === "scan" && rawText ? (
              <NeoWindow title="OCR Result" variant="maybe" size="sm">
                <p className="whitespace-pre-wrap text-sm font-black uppercase tracking-[0.04em]">
                  {rawText}
                </p>
              </NeoWindow>
            ) : null}

            {mode === "scan" && ingredients.length > 0 ? (
              <NeoWindow title="Parsed Ingredients" variant="vegan" size="sm">
                <div className="flex flex-col gap-2">
                  {ingredients.map((item, i) => (
                    <div key={i} className={`ingredient ${item.confidence}`}>
                      <span>{item.quantity ?? "—"}</span>
                      <span>{item.unit ?? ""}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </NeoWindow>
            ) : null}

            {isLoading ? (
              <NeoWindow title="Loading" variant="maybe" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  Routing to results...
                </p>
              </NeoWindow>
            ) : null}

            <div data-tour="analyze">
              <NeoButton
                onClick={handleAnalyze}
                disabled={isLoading || loading}
                tone="secondary"
                className="w-full"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </NeoButton>
            </div>
          </div>
        </NeoWindow>
      </div>
    </main>
  );
}
