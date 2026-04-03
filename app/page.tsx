"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NeoButton from "@/components/ui/NeoButton";
import NeoSwitch from "@/components/ui/NeoSwitch";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

const INPUT_STORAGE_KEY = "vegan-eyes:last-scan";
const messages = ["SCAN A RECIPE", "SCAN AN INGREDIENT"];

export default function Home() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState("");
  const [mode, setMode] = useState<"scan" | "type">("scan");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

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

  function handleAnalyze() {
    const trimmed = ingredients.trim();

    if (!trimmed) {
      setError("Paste or scan at least one ingredient.");
      return;
    }

    setError("");
    setIsLoading(true);
    sessionStorage.setItem(INPUT_STORAGE_KEY, trimmed);
    router.push("/results");
  }

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
                  <div
                    className="h-24 w-24 rounded-full border-[3px] border-[#000000] shadow-[6px_6px_0px_#000000]"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <p className="max-w-[280px] text-sm font-black uppercase leading-6 tracking-[0.08em]">
                    Camera scanner placeholder. Switch to Type to enter label text.
                  </p>
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
                <p className="text-sm font-black uppercase tracking-[0.04em]">
                  {error}
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
              disabled={isLoading}
              tone="secondary"
              className="w-full"
            >
              Analyze
            </NeoButton>
          </div>
        </NeoWindow>
      </div>
    </main>
  );
}
