import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"], style: ["normal", "italic"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} ($${site.ticker}): ${site.tagline}`,
  description: site.description,
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: `${site.name} ($${site.ticker})`,
    description: site.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sherwood: take from the trades, give to the holders" }],
  },
  twitter: { card: "summary_large_image", title: `${site.name} ($${site.ticker})`, description: site.description, images: ["/og.png"] },
};

export const viewport: Viewport = { themeColor: "#08120d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jbmono.variable}`}>
      <body className="grain min-h-dvh">{children}</body>
    </html>
  );
}
