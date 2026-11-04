import type { Metadata } from "next";
import NeoWindow from "@/components/ui/NeoWindow";
import SiteLinks from "@/components/ui/SiteLinks";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support | Vegan Eyes"
};

const questions: { q: string; a: string }[] = [
  {
    q: "A swap looks wrong",
    a: "Open the swap's Deeper section on the result and tap Report a wrong swap. We read every report and fix the ingredient list."
  },
  {
    q: "The photo didn't read my recipe",
    a: "Try a closer, brighter photo with the whole ingredient list in view, or switch to Type and paste the recipe instead."
  },
  {
    q: "A barcode wasn't found",
    a: "Some products aren't in the food database yet. Snap the ingredient list on the back of the pack instead."
  },
  {
    q: "I didn't get the sign-up email",
    a: "Check your spam folder. The email comes from Supabase, our sign-in provider. Once you've confirmed, sign in from the app."
  },
  {
    q: "How do I delete my account?",
    a: "In the app, open Profile, then Delete account. Your account and everything saved with it is removed straight away."
  }
];

export default function SupportPage() {
  return (
    <main className="app-shell">
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Support" variant="vegan" size="lg">
          <h1 className="text-[34px] leading-[1.05]">How can we help?</h1>
        </NeoWindow>

        {questions.map((item) => (
          <NeoWindow key={item.q} title={item.q} size="md">
            <p className="text-sm font-bold leading-6">{item.a}</p>
          </NeoWindow>
        ))}

        {SUPPORT_EMAIL ? (
          <NeoWindow title="Still stuck?" size="md">
            <p className="text-sm font-bold leading-6">
              Email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-4">
                {SUPPORT_EMAIL}
              </a>{" "}
              and we&apos;ll get back to you.
            </p>
          </NeoWindow>
        ) : null}

        <SiteLinks />
      </div>
    </main>
  );
}
