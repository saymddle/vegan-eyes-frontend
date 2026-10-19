"use client";

import { usePathname } from "next/navigation";
import NeoButton from "./NeoButton";
import NeoWindow from "./NeoWindow";

const navItems = [
  { href: "/", label: "Scan" },
  { href: "/community", label: "Community" },
  { href: "/my-scans", label: "Library" },
  { href: "/profile", label: "Profile" }
];

export default function BottomNav() {
  const pathname = usePathname();

  // The intro has its own buttons.
  if (pathname === "/welcome") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <NeoWindow variant="maybe" size="sm" className="mx-auto max-w-[500px]">
        <nav className="grid grid-cols-4 gap-1 min-[360px]:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname === "/scan"
                : pathname.startsWith(item.href) ||
                  (item.href === "/my-scans" &&
                    pathname.startsWith("/library"));

            return (
              <NeoButton
                key={item.href}
                href={item.href}
                tone={isActive ? "primary" : "base"}
                className="min-w-0 px-0! py-3 text-[9px] tracking-normal! min-[360px]:text-[10px] min-[360px]:tracking-[0.02em]! min-[400px]:text-xs min-[400px]:tracking-[0.04em]!"
              >
                {item.label}
              </NeoButton>
            );
          })}
        </nav>
      </NeoWindow>
    </div>
  );
}
