/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- SEO DITAMBAHKAN DI SINI ---
const siteConfig = {
  title: "ProPresenter Timer Dashboard | GMS Lampung",
  description:
    "Lihat live countdown timer ProPresenter untuk ibadah GMS Lampung.",
  url: "https://propressenter-timer.vercel.app", // URL website Anda
};

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url), // Penting untuk OG images

  // Open Graph (untuk Facebook, WhatsApp, LinkedIn, dll.)
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "GMS Lampung",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Anda harus membuat file ini
        width: 1200,
        height: 630,
        alt: "GMS Lampung ProPresenter Timer Dashboard",
      },
    ],
  },

  // Twitter Card (untuk X / Twitter)
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image.png"], // Anda harus membuat file ini
  },

  // Favicon dan Ikon
  icons: {
    icon: "/favicon.ico", // Anda harus membuat file ini
    apple: "/apple-touch-icon.png", // Anda harus membuat file ini
  },

  // Warna Tema (untuk browser di HP)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" }, // Sesuai dark mode Anda
  ],
};
// --- AKHIR BAGIAN SEO ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
