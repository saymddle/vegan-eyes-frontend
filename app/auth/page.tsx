import NeoButton from "@/components/ui/NeoButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

export default function AuthPage() {
  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Auth Required" variant="maybe" size="lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Sign in required.
            </h1>
            <p className="text-sm font-bold uppercase leading-6 tracking-[0.04em]">
              Supabase auth UI is coming next. Connect a user session before
              saving or loading scans.
            </p>
            <NeoButton href="/" tone="base">
              Back to Scan
            </NeoButton>
          </div>
        </NeoWindow>
      </div>
    </main>
  );
}
