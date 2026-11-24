import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Red_Hat_Display({ subsets: ["latin"], display: "swap", variable: "--font-rh-display" });
const text = Red_Hat_Text({ subsets: ["latin"], display: "swap", variable: "--font-rh-text" });

export const metadata: Metadata = {
  title: "Telora: see your poster from across the hallway",
  description:
    "Upload a poster, pick the print size and how far away people stand. Telora shows which text goes unreadable and at exactly how many metres, before you print.",
  metadataBase: new URL("https://telora.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
