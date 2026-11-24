import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Red_Hat_Display({ subsets: ["latin"], display: "swap", variable: "--font-rh-display" });
const text = Red_Hat_Text({ subsets: ["latin"], display: "swap", variable: "--font-rh-text" });

const TITLE = "Telora: know before you print";
// 130 characters: the problem (posters are read from metres away) and the fix (which line, how far, how much bigger).
const DESCRIPTION =
  "Posters get read from metres away. Telora shows which line of yours stops reading, at how many metres, and how much to enlarge it.";

export const metadata: Metadata = {
  title: { default: TITLE, template: "%s | Telora" },
  description: DESCRIPTION,
  metadataBase: new URL("https://telora.vercel.app"),
  // The image comes from app/opengraph-image.tsx; Next adds it to both cards.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Telora",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      {/* overflow-x-clip (not hidden) keeps the sticky header working and stops any stray sideways page scroll. */}
      <body className="min-h-screen overflow-x-clip antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
