"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The vegan version now lives in the Vegan tab of the scan result.
export default function ConvertPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/results");
  }, [router]);
  return null;
}
