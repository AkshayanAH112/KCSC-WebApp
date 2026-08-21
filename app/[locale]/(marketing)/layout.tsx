import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./marketing.css";
import { siteConfig } from "@/lib/constants";
import Navbar from "@/components/landing/layout/Navbar";
import JoinModal from "@/components/landing/ui/JoinModal";
import RenewModal from "@/components/landing/ui/RenewModal";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const OG_IMAGE = { ...DEFAULT_OG_IMAGE, alt: siteConfig.name };

// Every marketing page inherits this (metadataBase resolves relative URLs in
// their own metadata, e.g. alternates.languages); pages that set their own
// title/description/openGraph override these defaults rather than merge
// with them, per Next.js's metadata resolution rules.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    metadataBase: new URL(siteConfig.url),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [OG_IMAGE],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [OG_IMAGE.url],
    },
  };
}

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
