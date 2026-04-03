"use client";

import { useRouter } from "next/navigation";

type Crumb = {
  label: string;
  path?: string;
};

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const router = useRouter();

  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          <span
            onClick={() => item.path && router.push(item.path)}
            className={`border-[2px] border-[#000000] bg-[#DEE1E0] px-2 py-1 shadow-[2px_2px_0_#000000] ${
              item.path
                ? "cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                : "cursor-default opacity-60"
            }`}
          >
            {item.label}
          </span>

          {index < items.length - 1 && <span>/</span>}
        </div>
      ))}
    </div>
  );
}
