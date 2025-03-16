import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from '@next/third-parties/google'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/app/contexts/ThemeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Scio.ly',
  description: "Scio.ly provides a comprehensive test-taking platform carefully designed and crafted for Science Olympiad students – available to everyone, for free.",

  icons: {
    icon: "/site-logo.png"
  },
  keywords: ['Science Olympiad', 'Scioly practice tests', 'Scioly practice', 'Scioly tests', 'Biodiversity'],
  metadataBase: new URL("https://scio.ly"),
  openGraph: {
    siteName: "Scio.ly",
    description: "Scio.ly provides a comprehensive, organized platform carefully designed and crafted for Science Olympiad students – available to everyone, for free.",
    type: "website",
    locale: "en_US"
  },
  authors: [
    { name: 'Kundan Baliga', url: 'https://github.com/Kudostoy0u' },
    { name: 'Aiden Xie', url: 'https://github.com/thetinfoilhat' },
    { name: 'Steven He', url: 'https://github.com/the-evens' }
  ],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow"
  },
  appleWebApp: {
    title: "Scio.ly",
    statusBarStyle: "default",
    capable: true
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/site-logo.png" sizes="any" />
      </head>
      <body  
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <GoogleAnalytics gaId="G-P9SVV3TY4G" />
        <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "f5838db0caa649f9a42aeb710f79a241"}'></script>
      </body>
    </html>
  );
}
