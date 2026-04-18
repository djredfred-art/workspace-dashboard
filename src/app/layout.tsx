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

export const metadata: Metadata = {
  title: "Workspace Updates Dashboard",
  description: "Daily breakdown of important Google Workspace updates for K12 and Higher Ed institutions",
};

import Link from 'next/link';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav className="main-nav">
          <div className="nav-container">
            <div className="nav-logo">EduTech Dashboard</div>
            <div className="nav-links">
              <Link href="/" className="nav-link">Workspace Updates</Link>
              <Link href="/industry-news" className="nav-link">Industry News</Link>
              <Link href="/app-ideas" className="nav-link">App Ideas</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
