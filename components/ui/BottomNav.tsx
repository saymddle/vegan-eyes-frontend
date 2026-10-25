"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/features";

const icons: Record<string, React.ReactNode> = {
  Scan: <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" />,
  Community: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4" />
    </>
  ),
  Library: <path d="M5 4h4v16H5zM10 4h4v16h-4zM15 5l4 1-3 14-4-1" />,
  Profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  )
};

const navItems = [
  { href: "/", label: "Scan" },
  ...(FEATURES.community ? [{ href: "/community", label: "Community" }] : []),
  { href: "/my-scans", label: "Library" },
  { href: "/profile", label: "Profile" }
];

export default function BottomNav() {
  const pathname = usePathname();

  // The intro has its own buttons.
  if (pathname === "/welcome") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#20251F] bg-white pb-[env(safe-area-inset-bottom)]">
      <nav
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        className="mx-auto grid max-w-[500px] px-2 pb-2 pt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === "/scan"
              : pathname.startsWith(item.href) ||
                (item.href === "/my-scans" && pathname.startsWith("/library"));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 text-[11px] ${
                isActive ? "font-bold text-[#214E34]" : "font-semibold text-[#20251F]"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full ${
                  isActive ? "border-2 border-[#20251F] bg-[#A9D94C]" : ""
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {icons[item.label]}
                </svg>
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
