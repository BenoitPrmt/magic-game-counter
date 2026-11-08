import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
const outfit = localFont({
  src: "../public/fonts/outfit-latin.woff2",
  variable: "--font-outfit",
  display: "swap",
  weight: "100 900",
});
export const metadata: Metadata = {
  title: "Compagnon — Compteur de vies Magic",
  description:
    "Compteur de points de vie pour Magic, de 2 à 6 joueurs, utilisable hors ligne.",
  manifest: "/manifest.webmanifest",
  applicationName: "Compagnon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Compagnon",
  },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#191918",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={outfit.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
