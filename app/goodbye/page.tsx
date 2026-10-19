import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

export default function GoodbyePage() {
  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Account deleted" variant="vegan" size="lg">
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
            We miss you already!
          </h1>
        </NeoWindow>
        <NeoButton
          href="/auth"
          tone="secondary"
          className="w-full py-3 text-lg"
        >
          Home
        </NeoButton>
      </div>
    </main>
  );
}
