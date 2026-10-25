"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import BarcodeScanner from "@/components/features/BarcodeScanner";
import Walkthrough, {
  type WalkthroughStep
} from "@/components/features/Walkthrough";
import WelcomeCard from "@/components/features/WelcomeCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoSwitch from "@/components/ui/NeoSwitch";
import NeoWindow from "@/components/ui/NeoWindow";
import { INTRO_SEEN, SCAN_TOUR_SEEN, hasFlag } from "@/lib/onboarding/flags";
import type { Product } from "@/lib/products/openFoodFacts";
import { storeProductScan, storeScanInput } from "@/lib/store/recipeInput";
import { readUpload } from "@/lib/utils/readUpload";
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
  // A recipe PDF picked with Upload; photos go in `image`.
  const [pdf, setPdf] = useState<{ name: string; dataUrl: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  // Which source button is highlighted under the camera.
  const [fromUpload, setFromUpload] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
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
        body: "Tap the camera to take a photo, the arrow to upload a photo or PDF, or the barcode to look up a packaged product. Or switch to Type and paste. No recipe handy?",
        extra: (
          <button
            type="button"
            onClick={() => {
              setMode("type");
              setTypedIngredients(SAMPLE_RECIPE);
            }}
            className="min-h-[44px] w-full border-2 border-[#20251F] px-3 text-xs font-bold rounded-xl"
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
    setFromUpload(false);
  };

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setScanError("");
    try {
      const upload = await readUpload(file);
      if (upload.kind === "pdf") {
        setPdf({ name: upload.name, dataUrl: upload.dataUrl });
        setImage(null);
      } else {
        setImage(upload.dataUrl);
        setPdf(null);
      }
      setFromUpload(true);
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Couldn't open that file."
      );
    }
  }

  async function handleBarcode(barcode: string) {
    setLookingUp(true);
    setScanError("");

    try {
      const res = await fetch(
        `/api/product?barcode=${encodeURIComponent(barcode)}`
      );
      const data = (await res.json()) as { product?: Product };
      const product = data.product;

      if (res.status === 404 || (res.ok && !product)) {
        setScanError(
          "We don't know this barcode yet. Snap the ingredient list on the back instead."
        );
      } else if (!res.ok || !product) {
        setScanError(
          "Couldn't look up that barcode. Check your connection and try again."
        );
      } else if (!product.ingredients) {
        setScanError(
          `Found ${product.name || "this product"}, but it has no ingredient list yet. Snap the ingredient list on the back instead.`
        );
      } else {
        storeProductScan(product);
        router.push("/results");
        return;
      }
      setBarcodeOpen(false);
    } catch {
      setScanError(
        "Couldn't look up that barcode. Check your connection and try again."
      );
      setBarcodeOpen(false);
    } finally {
      setLookingUp(false);
    }
  }

  function clearPicture() {
    setImage(null);
    setPdf(null);
    setFromUpload(false);
  }

  async function handleScan(
    payload: { imageBase64: string } | { pdfBase64: string }
  ) {
    setLoading(true);
    setScanError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as {
        ingredients?: Ingredient[];
        raw?: string;
      };

      setIngredients(data.ingredients ?? []);
      setRawText(data.raw ?? "");

      if (!res.ok || !data.raw?.trim()) {
        setScanError(
          "pdfBase64" in payload
            ? "Couldn't read any text in that PDF."
            : "Couldn't read any text. Try a closer, brighter photo."
        );
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

    if (pdf) {
      await handleScan({ pdfBase64: pdf.dataUrl });
      return;
    }

    if (!image) {
      return;
    }

    await handleScan({ imageBase64: image });
  };

  // Keeps the camera off until we know this isn't a first visit.
  if (!introSeen) {
    return (
      <main className="app-shell" />
    );
  }

  return (
    <main className="app-shell">
      <Walkthrough steps={tourSteps} storageKey={SCAN_TOUR_SEEN} />
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow variant="vegan" size="lg">
          <div className="relative flex flex-col gap-6">
            <div className="absolute right-0 top-0 z-10">
            <button
              type="button"
              onClick={() => setShowHelp((open) => !open)}
              aria-expanded={showHelp}
              aria-controls="how-it-works"
              aria-label="How Vegan Eyes works"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#20251F] text-base font-bold after:absolute after:-inset-2 after:content-['']"
              style={{
                backgroundColor: showHelp ? colors.black : colors.white,
                color: showHelp ? colors.white : colors.black
              }}
            >
              ?
            </button>
            </div>
            {showHelp ? (
              <WelcomeCard onClose={() => setShowHelp(false)} />
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex h-[80px] max-w-[260px] items-end">
                <h1
                  className={`text-[32px] uppercase leading-[1.05] transition-opacity duration-200 ${
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
              className="rounded-2xl border-2 border-[#20251F] bg-white p-3 text-[#20251F]"
            >
              {mode === "scan" ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                  {barcodeOpen ? (
                    <BarcodeScanner
                      onDetected={handleBarcode}
                      onCancel={() => setBarcodeOpen(false)}
                      busy={lookingUp}
                    />
                  ) : pdf ? (
                    <div className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-[#FFF7E8] p-4">
                      <span aria-hidden="true" className="text-5xl">
                        📄
                      </span>
                      <span className="max-w-full break-all text-sm font-bold">
                        {pdf.name}
                      </span>
                    </div>
                  ) : image ? (
                    <img
                      src={image}
                      alt="Your recipe photo"
                      className="h-full max-h-[260px] w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      audio={false}
                      videoConstraints={{
                        facingMode: "environment"
                      }}
                      className="h-full max-h-[260px] w-full rounded-xl object-cover"
                    />
                  )}

                  <div
                    role="group"
                    aria-label="Picture source"
                    className={`grid w-full grid-cols-3 gap-[2px] rounded-full border-2 border-[#20251F] bg-white p-[3px] ${
                      barcodeOpen ? "hidden" : ""
                    }`}
                  >
                    <SourceButton
                      label={image || pdf ? "Retake" : "Photo"}
                      ariaLabel={image || pdf ? "Retake" : "Take a photo"}
                      active={!barcodeOpen && !fromUpload}
                      onClick={image || pdf ? clearPicture : handleCapture}
                    >
                      {image || pdf ? <RetakeIcon /> : <CameraIcon />}
                    </SourceButton>
                    <SourceButton
                      label="Upload"
                      ariaLabel="Upload a photo or PDF"
                      active={!barcodeOpen && fromUpload}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon />
                    </SourceButton>
                    <SourceButton
                      label="Barcode"
                      ariaLabel="Scan a barcode"
                      active={barcodeOpen}
                      onClick={() => {
                        clearPicture();
                        setScanError("");
                        setBarcodeOpen(true);
                      }}
                    >
                      <BarcodeIcon />
                    </SourceButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFile}
                      className="hidden"
                      aria-label="Upload a photo or PDF of a recipe"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={typedIngredients}
                  onChange={(event) => setTypedIngredients(event.target.value)}
                  rows={9}
                  placeholder="Paste a recipe or type ingredients: 2 eggs, 1 cup milk, butter..."
                  className="min-h-[220px] w-full resize-none bg-transparent text-base font-bold leading-7 outline-none placeholder:text-[#5B6158]/75"
                />
              )}
            </div>

            {scanError ? (
              <NeoWindow title="Scan Error" variant="not_vegan" size="sm" boxed>
                <p className="text-sm font-semibold">
                  {scanError}
                </p>
              </NeoWindow>
            ) : null}

            {mode === "scan" && rawText ? (
              <NeoWindow title="OCR Result" variant="maybe" size="sm">
                <p className="whitespace-pre-wrap text-sm font-semibold">
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
                <p className="text-sm font-semibold">
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

// One side of the Photo / Upload / Barcode toggle under the camera. The
// highlighted side shows which source is in use; each still does its own
// job when tapped.
function SourceButton({
  label,
  ariaLabel,
  active,
  onClick,
  children
}: {
  label: string;
  ariaLabel: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      title={ariaLabel}
      className={`flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-full px-1 text-sm font-bold transition-colors ${
        active ? "bg-[#214E34] text-[#FFF7E8]" : "text-[#20251F] hover:bg-[#FFF7E8]"
      }`}
    >
      {children}
      <span aria-hidden="true">{label}</span>
    </button>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
};

function CameraIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function RetakeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v4h16v-4" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3" />
      <path d="M7 8v8M10 8v8M14 8v8M17 8v8" strokeWidth={2} />
      <path d="M12 8v8" strokeWidth={1} />
    </svg>
  );
}
