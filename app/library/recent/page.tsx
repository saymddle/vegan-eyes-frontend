"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import HistoryCard from "@/components/features/HistoryCard";
import IngredientCard from "@/components/features/IngredientCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans } from "@/lib/api/getScans";
import { AUTH_REQUIRED_ERROR } from "@/lib/api/scansAuth";
import type { SavedScan } from "@/lib/store/savedScans";
import { colors } from "@/lib/theme/colors";

export default function LibraryRecentPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SavedScan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadScans() {
      try {
        const parsed = await getScans();

        if (isActive) {
          setRecords(parsed);
          setSelectedId(parsed[0]?.id || null);
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.message === AUTH_REQUIRED_ERROR
        ) {
          router.push("/auth");
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

  const visibleRecords = useMemo(
    () =>
      [...records].sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime()
      ),
    [records]
  );

  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedId) ||
    visibleRecords[0];

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "LIBRARY", path: "/library" },
            { label: "RECENT" }
          ]}
        />

        <NeoWindow title="Recent" variant="vegan" size="lg">
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
            Latest saved scans.
          </h1>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading recent scans...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && visibleRecords.length === 0 ? (
          <NeoWindow title="No saved scans yet" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Save a result to build your library.
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading
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

        {!isLoading && selectedRecord ? (
          <NeoWindow
            title="Open Detail"
            variant={selectedRecord.result.status}
            size="md"
          >
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase leading-6 tracking-[0.04em]">
                {selectedRecord.input}
              </p>
              {selectedRecord.result.ingredients.map((ingredient, index) => (
                <IngredientCard
                  key={`${ingredient.name}-${index}`}
                  ingredient={ingredient}
                />
              ))}
            </div>
          </NeoWindow>
        ) : null}
      </div>
    </main>
  );
}
