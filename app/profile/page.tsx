"use client";

import { useEffect, useMemo, useState } from "react";
import NeoWindow from "@/components/ui/NeoWindow";
import { getScans, type SavedScan } from "@/lib/store/savedScans";
import { colors } from "@/lib/theme/colors";

const settingsItems = [
  "Edit Profile",
  "Preferences",
  "Saved Data",
  "About",
  "Logout"
];

export default function ProfilePage() {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [activeSetting, setActiveSetting] = useState("Edit Profile");

  useEffect(() => {
    setScans(getScans());
  }, []);

  const savedRecipes = useMemo(
    () => scans.filter((scan) => scan.input.trim().length > 0).length,
    [scans]
  );

  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Profile" variant="vegan" size="lg">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border-[3px] border-[#000000] bg-[#DEE1E0]" />
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
                Guest
              </h1>
              <p className="text-sm font-bold uppercase tracking-[0.08em]">
                Your account
              </p>
            </div>
          </div>
        </NeoWindow>

        <div className="grid grid-cols-2 gap-4">
          <NeoWindow title="Total Scans" variant="maybe" size="sm">
            <p className="text-4xl font-black uppercase">{scans.length}</p>
          </NeoWindow>
          <NeoWindow title="Saved Recipes" variant="maybe" size="sm">
            <p className="text-4xl font-black uppercase">{savedRecipes}</p>
          </NeoWindow>
        </div>

        {settingsItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setActiveSetting(item)}
            className="cursor-pointer text-left transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <NeoWindow
              title={item}
              variant={activeSetting === item ? "vegan" : "maybe"}
              size="sm"
            >
              <p className="text-sm font-black uppercase tracking-[0.04em]">
                {activeSetting === item ? "Selected" : "Open"}
              </p>
            </NeoWindow>
          </button>
        ))}
      </div>
    </main>
  );
}
