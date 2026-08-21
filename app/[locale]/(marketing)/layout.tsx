import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./marketing.css";
import { siteConfig } from "@/lib/constants";
import Navbar from "@/components/landing/layout/Navbar";
import JoinModal from "@/components/landing/ui/JoinModal";
import RenewModal from "@/components/landing/ui/RenewModal";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default async function MarketingRootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${inter.variable} font-sans`} style={{ colorScheme: "light" }}>
      <body className="antialiased min-h-screen flex flex-col relative bg-background">
        <NextIntlClientProvider messages={messages}>
          <MotionConfig reducedMotion="user">
            <Navbar />
            <main className="min-h-screen relative">{children}</main>
            <JoinModal />
            <RenewModal />
          </MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
