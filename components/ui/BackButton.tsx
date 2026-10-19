"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  // Where to go when there is no earlier page in this tab, such as after
  // opening a shared link.
  fallback?: string;
};

export default function BackButton({ label = "Back", fallback = "/" }: Props) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="min-h-[44px] self-start border-2 border-[#000000] bg-[#DEE1E0] px-3 py-1 text-xs font-black uppercase tracking-[0.06em] shadow-[3px_3px_0_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
    >
      ← {label}
    </button>
  );
}
