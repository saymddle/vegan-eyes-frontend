"use client";

import { useRouter } from "next/navigation";

type Crumb = {
  label: string;
  path?: string;
};

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const router = useRouter();

  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5B6158]">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.path ? (
            <button
              type="button"
              onClick={() => router.push(item.path!)}
              className="min-h-[44px] font-bold text-[#214E34] underline underline-offset-4"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#20251F]">{item.label}</span>
          )}

          {index < items.length - 1 && <span aria-hidden="true">/</span>}
        </div>
      ))}
    </div>
  );
}
