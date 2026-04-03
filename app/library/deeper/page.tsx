"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import {
  getDeeperItems,
  type DeeperItem
} from "@/lib/store/deeperStore";
import { colors } from "@/lib/theme/colors";

export default function DeeperLibraryPage() {
  const [items, setItems] = useState<DeeperItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setItems(getDeeperItems());
    setIsLoading(false);
  }, []);

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
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
            Saved ingredient insights.
          </h1>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading deeper insights...
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && items.length === 0 ? (
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

        {!isLoading
          ? items.map((item) => (
              <NeoWindow key={item.id} title={item.ingredient} variant="maybe" size="md">
                <div className="flex flex-col gap-3 text-sm font-bold uppercase leading-6 tracking-[0.04em]">
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
