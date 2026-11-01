import type { Metadata } from "next";
import NeoWindow from "@/components/ui/NeoWindow";
import SiteLinks from "@/components/ui/SiteLinks";

export const metadata: Metadata = {
  title: "Email confirmed | Vegan Eyes"
};

// Where the sign-up confirmation email lands. Sign-in happens in the app.
export default function EmailConfirmedPage() {
  return (
    <main className="app-shell">
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Account" variant="vegan" size="lg">
          <h1 className="text-[34px] leading-[1.05]">You&apos;re all set.</h1>
          <p className="mt-3 text-[15px] font-semibold leading-6">
            Your email is confirmed. Open Vegan Eyes on your phone and sign in.
          </p>
        </NeoWindow>
        <SiteLinks />
      </div>
    </main>
  );
}
