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
  title: "Scio.ly",
  description: "The Ultimate Study Guide",
  icons: {
    icon: "/site-logo.png"
  }
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
