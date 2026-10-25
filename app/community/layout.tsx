import { redirect } from "next/navigation";
import { FEATURES } from "@/lib/features";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  // Hidden for now: an old link to /community goes to Scan.
  if (!FEATURES.community) redirect("/");
  return children;
}
