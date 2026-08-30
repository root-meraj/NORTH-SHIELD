import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";

import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import MobileTabBar from "@/components/layout/MobileTabBar";
import ConnectivityWatch from "@/components/layout/ConnectivityWatch";
import DemoDriver from "@/components/demo/DemoDriver";

/** Display face: Bricolage Grotesque. Chosen for its slightly compressed,
 *  engineered feel — reads like a survey sheet title block, not a SaaS hero. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Northshield — Terrain intelligence for the North East",
  description:
    "Predicts landslides, floods and road closures across the eight North Eastern states, then reroutes people and supply convoys around them.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0C1416",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      style={{ ["--font-sans" as string]: GeistSans.style.fontFamily, ["--font-mono" as string]: GeistMono.style.fontFamily }}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans">
        {/* Skip link — keyboard users land here first */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-signal focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>

        <ConnectivityWatch />
        <TopNav />

        {/* pb clears the mobile tab bar + iOS home indicator */}
        <main id="main" className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-16">
          {children}
        </main>

        <MobileTabBar />
        <DemoDriver />

        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            className:
              "!bg-slate !border !border-hairline/60 !text-bone !rounded-xl !font-sans !text-sm",
          }}
        />
      </body>
    </html>
  );
}
