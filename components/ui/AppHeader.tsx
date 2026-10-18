import Image from "next/image";
import Link from "next/link";
import { colors } from "@/lib/theme/colors";

// The logo bar at the top of every page. It scrolls away with the page so
// it does not take space from the content on small phones.
export default function AppHeader() {
  return (
    <header
      className="border-b-[3px] border-[#000000]"
      style={{ backgroundColor: colors.base }}
    >
      <div className="mx-auto flex h-14 max-w-[500px] items-center px-6">
        <Link
          href="/"
          aria-label="Vegan Eyes home"
          className="flex items-center gap-3"
        >
          <Image src="/logo.png" alt="" width={40} height={40} priority />
          <span className="text-lg font-black uppercase tracking-[0.04em]">
            Vegan Eyes
          </span>
        </Link>
      </div>
    </header>
  );
}
