import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./marketing.css";
import { siteConfig } from "@/lib/constants";
import Navbar from "@/components/landing/layout/Navbar";
import JoinModal from "@/components/landing/ui/JoinModal";
import RenewModal from "@/components/landing/ui/RenewModal";
import { MotionConfig } from "framer-motion";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function MarketingRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} style={{ colorScheme: "light" }}>
      <body className="antialiased min-h-screen flex flex-col relative bg-background">
        <MotionConfig reducedMotion="user">
          <Navbar />
          <main className="min-h-screen relative">{children}</main>
          <JoinModal />
          <RenewModal />
        </MotionConfig>
      </body>
    </html>
  );
}
