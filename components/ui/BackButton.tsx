"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
};

export default function BackButton({ label = "BACK" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/library")}
      className="border-[3px] border-[#000000] bg-[#DEE1E0] px-3 py-1 font-bold uppercase shadow-[3px_3px_0_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
    >
      ← {label}
    </button>
  );
}
