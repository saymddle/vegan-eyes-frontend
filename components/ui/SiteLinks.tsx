import Link from "next/link";

// Footer links shared by the website's few remaining pages.
export default function SiteLinks() {
  return (
    <nav
      aria-label="Site"
      className="flex flex-wrap justify-center gap-6 pt-2 text-sm font-bold"
    >
      <Link href="/" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
        Get the app
      </Link>
      <Link href="/privacy" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
        Privacy
      </Link>
      <Link href="/support" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
        Support
      </Link>
    </nav>
  );
}
