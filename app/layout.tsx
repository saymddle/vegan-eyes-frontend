import type { Metadata } from "next";
import { Inter, Lilita_One } from "next/font/google";
import AppHeader from "@/components/ui/AppHeader";
import BottomNav from "@/components/ui/BottomNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

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
    <html lang="en" className={`${inter.variable} ${lilita.variable}`}>
      <body>
        <AppHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
