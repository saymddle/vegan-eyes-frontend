import type { Metadata } from "next";
import BackButton from "@/components/ui/BackButton";
import NeoWindow from "@/components/ui/NeoWindow";
import { colors } from "@/lib/theme/colors";

export const metadata: Metadata = {
  title: "Privacy | Vegan Eyes"
};

const UPDATED = "October 19, 2026";

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
      "When you scan a photo, it is sent to Mistral, an AI text-reading service, which returns the words in it. We don't store the photo.",
      "The text from a photo, or a recipe you paste, is checked against our ingredient list on our server and is only saved if you tap Save.",
      "Mistral handles photos under its own privacy policy."
    ]
  },
  {
    title: "Where it's stored",
    points: [
      "Saved data lives in our Supabase database. Each account can only read its own scans, recipes and notes.",
      "The app is hosted on Vercel, which keeps standard server logs such as IP addresses for a short time.",
      "On your device, the scan you're working on is kept in the browser tab and cleared when you close it. Your sign-in is remembered by your browser until you sign out."
    ]
  },
  {
    title: "What we don't do",
    points: [
      "No ads, no tracking cookies and no analytics tools.",
      "We don't sell or share your data with anyone beyond the services named here."
    ]
  },
  {
    title: "Deleting your data",
    points: [
      "You can delete any saved recipe or scan from your Library at any time.",
      "Signing out removes your sign-in from this device."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="app-shell" style={{ backgroundColor: colors.base }}>
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <BackButton />
        <NeoWindow title="Privacy" variant="vegan" size="lg">
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em]">
            Your data, plainly.
          </h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.04em]">
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
      </div>
    </main>
  );
}
