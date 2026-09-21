import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "BasketLaunch — launch a basket of Solana tokens",
  description:
    "BasketLaunch mints one token backed by a weighted basket of Solana assets, prices it on a bonding curve, and routes trading fees back into the basket. Public beta, simulated markets.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2224%22 fill=%22%23C2F24E%22/><text x=%2250%22 y=%2272%22 font-size=%2264%22 font-family=%22sans-serif%22 font-weight=%22700%22 text-anchor=%22middle%22 fill=%22%2305070B%22>B</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <StoreProvider>
          <SiteHeader />
          <Ticker />
          <main>{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
