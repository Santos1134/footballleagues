import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Liberia Leagues - Official Football League Management System",
    template: "%s | Liberia Leagues"
  },
  description: "Official platform for Liberia's football leagues. View fixtures, standings, teams, players, and live match results. Track the National County Sports Meet and division leagues.",
  keywords: [
    "Liberia football",
    "Liberia soccer",
    "Liberia leagues",
    "National County Sports Meet",
    "Liberia football fixtures",
    "Liberia football standings",
    "Liberian football teams",
    "Liberia sports",
    "West Africa football"
  ],
  authors: [{ name: "Liberia Leagues" }],
  creator: "Liberia Leagues",
  publisher: "Liberia Leagues",
  metadataBase: new URL("https://www.liberialeagues.com"),
  alternates: {
    canonical: "https://www.liberialeagues.com"
  },
  openGraph: {
    title: "Liberia Leagues - Official Football League Management",
    description: "Track Liberia's football leagues, fixtures, standings, and results. Home of the National County Sports Meet.",
    url: "https://www.liberialeagues.com",
    siteName: "Liberia Leagues",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // We'll create this later
        width: 1200,
        height: 630,
        alt: "Liberia Leagues - Football Management System"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberia Leagues - Official Football League Management",
    description: "Track Liberia's football leagues, fixtures, standings, and results.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    // Add your Google Search Console verification code here later
    // google: 'your-verification-code',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
