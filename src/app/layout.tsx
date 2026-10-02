import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  subsets: ["myanmar"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MM-NameChanger — Romanized Myanmar names to Unicode",
  description:
    "Convert English-romanized Myanmar (Burmese) personal names into Myanmar script (Unicode). Dictionary + rule engine, no AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoMyanmar.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
