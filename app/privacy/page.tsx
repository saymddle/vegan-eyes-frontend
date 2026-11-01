import type { Metadata } from "next";
import NeoWindow from "@/components/ui/NeoWindow";
import SiteLinks from "@/components/ui/SiteLinks";

export const metadata: Metadata = {
  title: "Privacy | Vegan Eyes"
};

const UPDATED = "November 1, 2026";

const sections: { title: string; points: string[] }[] = [
  {
    title: "What we keep",
    points: [
      "Your email address and password, if you create an account. Passwords are handled by our sign-in provider, Supabase, and we never see them.",
      "Your display name and bio, if you add them on your profile.",
      "The scans, recipes and ingredient notes you choose to save, and any swap you report as wrong.",
      "Nothing else. If you never sign in, nothing you scan or paste is kept on our servers."
    ]
  },
  {
    title: "Photos and pasted recipes",
    points: [
      "When you scan a photo or PDF, it is sent to Mistral, an AI text-reading service, which returns the words in it. We don't store the photo.",
      "Recipes are checked against our ingredient list on your phone, and are only saved if you tap Save.",
      "When you scan a barcode, the number is looked up in Open Food Facts, a free public food database.",
      "Mistral handles photos under its own privacy policy."
    ]
  },
  {
    title: "Where it's stored",
    points: [
      "Saved data lives in our Supabase database. Each account can only read its own scans, recipes and notes.",
      "Photo reading and barcode lookups go through our server on Vercel, which keeps standard server logs such as IP addresses for a short time.",
      "On your phone, the scan you're working on is kept only while the app is open. Your sign-in is remembered by the app until you sign out."
    ]
  },
  {
    title: "What we don't do",
    points: [
      "No ads, no tracking and no analytics tools.",
      "We don't sell or share your data with anyone beyond the services named here."
    ]
  },
  {
    title: "Deleting your data",
    points: [
      "You can delete any saved recipe from your Library at any time.",
      "You can delete your whole account from your Profile. That removes your account and everything saved with it, straight away.",
      "Signing out removes your sign-in from this phone."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="app-shell">
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <NeoWindow title="Privacy" variant="vegan" size="lg">
          <h1 className="text-[34px] leading-[1.05]">
            Your data, plainly.
          </h1>
          <p className="mt-3 text-xs font-semibold">
            Updated {UPDATED}
          </p>
        </NeoWindow>

        {sections.map((section) => (
          <NeoWindow key={section.title} title={section.title} size="md">
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm font-bold leading-6">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </NeoWindow>
        ))}
        <SiteLinks />
      </div>
    </main>
  );
}
