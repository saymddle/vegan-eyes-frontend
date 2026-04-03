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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <NeoWindow
        title="Navigate"
        variant="maybe"
        size="sm"
        className="mx-auto max-w-[500px]"
      >
        <nav className="grid grid-cols-4 gap-2">
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
                className="px-2 py-3 text-xs"
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
