"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { getDeeper } from "@/lib/api/getDeeper";
import { AUTH_REQUIRED_ERROR, authPath } from "@/lib/api/scansAuth";
import { toggleFavorite } from "@/lib/api/toggleFavorite";
import type { DeeperItem } from "@/lib/store/deeperStore";
import { colors } from "@/lib/theme/colors";

export default function DeeperLibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<DeeperItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadInsights() {
      try {
        const nextItems = await getDeeper();

        if (isActive) {
          setItems(nextItems);
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
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load deeper insights"
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInsights();

    return () => {
      isActive = false;
    };
  }, [router]);

  const visibleItems = useMemo(() => {
    const filtered = favoritesOnly
      ? items.filter((item) => item.is_favorite)
      : items;

    return [...filtered].sort((left, right) => {
      if (left.is_favorite !== right.is_favorite) {
        return Number(right.is_favorite) - Number(left.is_favorite);
      }

      return (
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime()
      );
    });
  }, [favoritesOnly, items]);

  async function handleToggleFavorite(item: DeeperItem) {
    try {
      const updated = await toggleFavorite(item.id, !item.is_favorite);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setError("");
    } catch (favoriteError) {
      if (
        favoriteError instanceof Error &&
        favoriteError.message === AUTH_REQUIRED_ERROR
      ) {
        router.push(authPath());
        return;
      }

      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Failed to update favorite"
      );
    }
  }

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "LIBRARY", path: "/library" },
            { label: "DEEPER" }
          ]}
        />

        <NeoWindow title="Deeper" variant="vegan" size="lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Saved ingredient insights.
            </h1>
            <NeoButton
              onClick={() => setFavoritesOnly((current) => !current)}
              tone={favoritesOnly ? "secondary" : "base"}
            >
              {favoritesOnly ? "All Insights" : "Favorites Only"}
            </NeoButton>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading deeper insights...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error && visibleItems.length === 0 ? (
          <NeoWindow title="No saved insights yet" variant="maybe" size="md">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                Save ingredient insights from Results to build your learning
                library.
              </p>
              <NeoButton href="/" tone="base">
                Scan to Discover
              </NeoButton>
            </div>
          </NeoWindow>
        ) : null}

        {!isLoading && error ? (
          <NeoWindow title="Error" variant="not_vegan" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              {error}
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error
          ? visibleItems.map((item) => (
              <NeoWindow
                key={item.id}
                title={item.ingredient}
                variant="maybe"
                size="md"
              >
                <div className="flex flex-col gap-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
                  <div className="flex items-center justify-between gap-4">
                    <p>{item.is_favorite ? "Favorite" : "Saved insight"}</p>
                    <NeoButton
                      onClick={() => void handleToggleFavorite(item)}
                      tone={item.is_favorite ? "secondary" : "base"}
                      className="px-3 py-1 text-lg"
                    >
                      {item.is_favorite ? "★" : "☆"}
                    </NeoButton>
                  </div>
                  <p>{item.reason}</p>
                  <p className="mt-2 font-black">Substitutes:</p>
                  <ul className="flex list-disc flex-col gap-2 pl-5">
                    {item.substitutes.map((substitute) => (
                      <li key={`${item.id}-${substitute}`}>{substitute}</li>
                    ))}
                  </ul>
                  <p className="text-xs font-black tracking-[0.08em]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </NeoWindow>
            ))
          : null}
      </div>
    </main>
  );
}
