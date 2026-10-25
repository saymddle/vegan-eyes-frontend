import Image from "next/image";
import Link from "next/link";

// The logo bar at the top of every page. It scrolls away with the page so
// it does not take space from the content on small phones.
export default function AppHeader() {
  return (
    <header className="border-b-2 border-[#20251F] bg-[#FFF7E8]">
      <div className="mx-auto flex h-14 max-w-[500px] items-center px-5">
        <Link
          href="/"
          aria-label="Vegan Eyes home"
          className="flex min-h-[44px] items-center gap-3"
        >
          <Image src="/logo.png" alt="" width={36} height={36} priority />
          <span className="font-display text-[22px] leading-none text-[#214E34]">
            Vegan Eyes
          </span>
        </Link>
      </div>
    </header>
  );
}
