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
      className="inline-flex min-h-[44px] items-center gap-1 self-start pr-2 text-[15px] font-bold text-[#214E34] hover:underline"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      {label}
    </button>
  );
}
