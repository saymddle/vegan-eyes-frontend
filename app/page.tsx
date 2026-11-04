import Image from "next/image";
import NeoWindow from "@/components/ui/NeoWindow";
import SiteLinks from "@/components/ui/SiteLinks";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

const points = [
  "Snap a cookbook page, upload a photo or PDF, or paste a recipe from any website.",
  "Every animal ingredient gets a plant-based swap you can change.",
  "Scan a barcode to check packaged food.",
  "Save your vegan recipes, then copy, share or print them."
];

// Vegan Eyes is a phone app now; the website only points to it.
export default function GetTheAppPage() {
  const stores = [
    { label: "Download on the App Store", href: APP_STORE_URL },
    { label: "Get it on Google Play", href: PLAY_STORE_URL }
  ].filter((store) => store.href);

  return (
    <main className="app-shell">
      <div className="mx-auto flex max-w-[500px] flex-col gap-6">
        <section className="flex flex-col items-center gap-6 rounded-2xl border-2 border-[#20251F] bg-[#E65A43] px-6 py-10 text-center text-[#20251F] shadow-[4px_4px_0px_#20251F]">
          <Image src="/icon-512.png" alt="" width={160} height={160} priority />
          <h1 className="text-[36px] uppercase leading-[1.05] [text-shadow:2px_2px_0_#20251F]">
            <span className="text-[#214E34]">Substitute</span>{" "}
            <span className="text-white">your</span>{" "}
            <span className="text-[#F5CF61]">usual</span>
          </h1>
          <p className="text-[17px] font-semibold leading-7">
            Vegan Eyes turns any recipe vegan. It lives on your phone now.
          </p>
          {stores.length ? (
            <div className="flex w-full flex-col gap-3">
              {stores.map((store) => (
                <a
                  key={store.label}
                  href={store.href}
                  className="flex min-h-[52px] items-center justify-center rounded-xl border-2 border-[#20251F] bg-[#214E34] px-5 text-base font-bold text-[#FFF7E8] shadow-[3px_3px_0px_#20251F]"
                >
                  {store.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border-2 border-[#20251F] bg-white px-4 py-3 text-sm font-bold">
              Coming soon to iPhone, then Android.
            </p>
          )}
        </section>

        <NeoWindow title="What it does" size="md">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm font-bold leading-6">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </NeoWindow>

        <SiteLinks />
      </div>
    </main>
  );
}
