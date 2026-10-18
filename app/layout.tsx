import type { Metadata } from "next";
import AppHeader from "@/components/ui/AppHeader";
import BottomNav from "@/components/ui/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vegan Eyes",
  description: "Scan ingredients and spot non-vegan additives fast."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
