"use client";

import { useEffect, useState } from "react";
import FeedCard from "@/components/features/FeedCard";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

const feed = [
  {
    title: "Gelatin Watchlist",
    description:
      "Quick breakdown of gummies, marshmallows, and capsule coatings that often hide animal gelatin.",
    creator: "@plantlabel"
  },
  {
    title: "Dairy-Free Swaps",
    description:
      "Ingredient substitutions for milk solids, whey, casein, and butter-derived additives.",
    creator: "@marketmapper"
  },
  {
    title: "Complex Additives",
    description:
      "How to verify enzymes, mono-diglycerides, and natural flavors when labels are vague.",
    creator: "@supplychainvegan"
  }
];

export default function CommunityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setIsLoading(false);
      } catch {
        setError("Unable to load community posts.");
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="app-shell" style={{ backgroundColor: colors.secondary }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow variant="maybe" size="lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Learn from label deep dives.
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              Community education posts and quick video placeholders for vegan
              ingredient literacy.
            </p>
          </div>
        </NeoWindow>

        {isLoading ? (
          <NeoWindow title="Loading" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              Loading community feed...
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

        {!isLoading && !error && feed.length === 0 ? (
          <NeoWindow title="Empty" variant="maybe" size="sm">
            <p className="text-sm font-black uppercase tracking-[0.04em]">
              No community posts available yet.
            </p>
          </NeoWindow>
        ) : null}

        {!isLoading && !error
          ? feed.map((post) => (
              <FeedCard
                key={`${post.title}-${post.creator}`}
                title={post.title}
                description={post.description}
                creator={post.creator}
              />
            ))
          : null}
      </div>
    </main>
  );
}
