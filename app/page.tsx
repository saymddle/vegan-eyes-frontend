"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import NeoButton from "@/components/ui/NeoButton";
import NeoSwitch from "@/components/ui/NeoSwitch";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

const INPUT_STORAGE_KEY = "vegan-eyes:last-scan";
const messages = ["SCAN A RECIPE", "SCAN AN INGREDIENT"];

export default function Home() {
  const router = useRouter();
  const webcamRef = useRef<Webcam | null>(null);
  const [ingredients, setIngredients] = useState("");
  const [mode, setMode] = useState<"scan" | "type">("scan");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string>("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setVisible(false);

      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 200);
    }, 2000);

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
      setError("Camera image capture failed. Please try again.");
      return;
    }

    setImage(screenshot);
    setError("");
  };

  const handleAnalyze = async () => {
    if (mode === "type") {
      const trimmed = ingredients.trim();

      if (!trimmed) {
        setError("Paste or scan at least one ingredient.");
        return;
      }

      setError("");
      setIsLoading(true);
      sessionStorage.setItem(INPUT_STORAGE_KEY, trimmed);
      router.push("/results");
      return;
    }

    if (!image) {
      setError("Capture an image before analyzing.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setOcrResult("");

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image })
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: unknown;
        text?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "OCR processing failed");
      }

      const extractedText = data.text ?? "";
      setOcrResult(extractedText);
      setIngredients(extractedText);

      console.log("OCR RESULT:", data);
    } catch (scanError) {
      console.error("OCR request failed", scanError);
      setError(scanError instanceof Error ? scanError.message : "OCR processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell" style={{ backgroundColor: colors.primary }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Vegan Eyes Scan" variant="vegan" size="lg">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-[80px] max-w-[260px] items-end">
                <h1
                  className={`text-4xl font-black uppercase leading-tight tracking-[-0.05em] transition-opacity duration-200 ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {messages[index]}
                </h1>
              </div>
              <NeoSwitch value={mode} onChange={setMode} />
            </div>

            <div
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
                  value={ingredients}
                  onChange={(event) => setIngredients(event.target.value)}
                  rows={9}
                  placeholder="Type ingredients: sugar, cocoa butter, soy lecithin..."
                  className="min-h-[220px] w-full resize-none bg-transparent text-base font-black uppercase leading-7 tracking-[0.04em] outline-none placeholder:text-[#474238]/40"
                />
              )}
            </div>

            {error ? (
              <NeoWindow title="Input Error" variant="not_vegan" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em]">{error}</p>
              </NeoWindow>
            ) : null}

            {mode === "scan" && ocrResult ? (
              <NeoWindow title="OCR Result" variant="maybe" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em] whitespace-pre-wrap">
                  {ocrResult}
                </p>
              </NeoWindow>
            ) : null}

            {isLoading ? (
              <NeoWindow title="Loading" variant="maybe" size="sm">
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  Routing to results...
                </p>
              </NeoWindow>
            ) : null}

            <NeoButton
              onClick={handleAnalyze}
              disabled={isLoading || loading}
              tone="secondary"
              className="w-full"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </NeoButton>
          </div>
        </NeoWindow>
      </div>
    </main>
  );
}
