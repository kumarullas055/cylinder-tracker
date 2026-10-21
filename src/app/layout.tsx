import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CylinTrack — Every Cylinder Accounted For",
    template: "%s | CylinTrack",
  },
  description: "Complete LPG cylinder distribution management platform. Track cylinders, drivers, payments, and stock with precision.",
  keywords: ["LPG", "cylinder", "distribution", "gas agency", "driver management", "stock tracking", "payment reconciliation"],
  authors: [{ name: "CylinTrack" }],
  creator: "CylinTrack",
  publisher: "CylinTrack",
  robots: "noindex, nofollow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cylintrack.com",
    siteName: "CylinTrack",
    title: "CylinTrack — Every Cylinder Accounted For",
    description: "Complete LPG cylinder distribution management platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CylinTrack Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CylinTrack",
    description: "Complete LPG cylinder distribution management platform.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}