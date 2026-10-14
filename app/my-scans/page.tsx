"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import HistoryCard from "@/components/features/HistoryCard";
import IngredientCard from "@/components/features/IngredientCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans } from "@/lib/api/getScans";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import type { SavedScan } from "@/lib/store/savedScans";
import { colors } from "@/lib/theme/colors";

export default function MyScansPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SavedScan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadScans() {
      try {
        const parsed = await getScans();

        if (isActive) {
          setRecords(parsed);
          setSelectedId(parsed[0]?.id || null);
          setError("");
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.message === AUTH_REQUIRED_ERROR
        ) {
          router.push(authPath());
          return;
        }

        if (isActive) {
          setError("Unable to load saved scans.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadScans();

    return () => {
      isActive = false;
    };
  }, [router]);

  const visibleRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const haystack = `${record.input} ${record.result.status} ${record.result.ingredients
        .map((item) => item.name)
        .join(" ")}`.toLowerCase();

      return haystack.includes(search.toLowerCase().trim());
    });

    return [...filtered].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
  }, [records, search]);

  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedId) || visibleRecords[0];

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="My Scans" variant="vegan" size="lg">
          <div className="flex flex-col gap-5">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Saved scan library.
            </h1>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ingredient or status"
              className="w-full border-[3px] border-[#000000] px-4 py-3 text-sm font-black uppercase tracking-[0.04em] shadow-[4px_4px_0px_#000000] outline-none"
              style={{
                backgroundColor: colors.white,
                color: colors.black
              }}
            />

            <div className="grid grid-cols-3 gap-3">
              <NeoButton href="/library/recent" tone="secondary">
                Recent
              </NeoButton>
              <NeoButton href="/library/recipes" tone="base">
                Recipes
              </NeoButton>
              <NeoButton href="/library/deeper" tone="base">
                Deeper
              </NeoButton>
            </div>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading saved scans...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && error ? (
          <NeoWindow title="Error" variant="not_vegan" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              {error}
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error && visibleRecords.length === 0 ? (
          <NeoWindow title="No saved scans yet" variant="maybe" size="sm">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                Save a result from the Results screen to see it here.
              </p>
              <NeoButton href="/" tone="base">
                Run a Scan
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading && !error
          ? visibleRecords.map((record) => (
              <HistoryCard
                key={record.id}
                createdAt={record.timestamp}
                input={record.input}
                result={record.result}
                onOpen={() => setSelectedId(record.id)}
              />
            ))
          : null}

        {!isLoading && !error && selectedRecord ? (
          <NeoWindow title="Open Detail" variant={selectedRecord.result.status} size="md">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase leading-6 tracking-[0.04em]">
                {selectedRecord.input}
              </p>
              {selectedRecord.result.ingredients.length === 0 ? (
                <NeoWindow title="Ingredients" variant="vegan" size="sm">
                  <p className="text-sm font-black uppercase tracking-[0.04em]">
                    No flagged ingredients saved for this result.
                  </p>
                </NeoWindow>
              ) : (
                selectedRecord.result.ingredients.map((ingredient, index) => (
                  <IngredientCard
                    key={`${ingredient.name}-${index}`}
                    ingredient={ingredient}
                  />
                ))
              )}
            </div>
          </NeoWindow>
        ) : null}
      </div>
    </main>
  );
}
