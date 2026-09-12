import type { Metadata } from "next";
import Script from "next/script";
import {
  Playfair_Display,
  Plus_Jakarta_Sans,
  Cinzel,
  Noto_Sans_Tamil,
  Noto_Serif_Tamil,
} from "next/font/google";
import "./marketing.css";
import { siteConfig } from "@/lib/constants";
import Navbar from "@/components/landing/layout/Navbar";
import JoinModal from "@/components/landing/ui/JoinModal";
import RenewModal from "@/components/landing/ui/RenewModal";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

// Three Latin families carry the design — Playfair for headlines, Plus Jakarta
// for body, Cinzel for the club wordmark only. None of them ships Tamil
// glyphs, so two Noto Tamil faces are loaded alongside and listed as the
// fallback on every variable below; without them the `ta` locale silently
// drops to whatever Tamil font the device happens to have.
//
// Two faces, not one: the Latin side splits serif headlines against sans body,
// and pointing every Tamil role at a single sans would have thrown that away —
// a Tamil page would read as structurally flatter than the same page in
// English. Serif Tamil carries the headings, sans Tamil the body.
const notoTamilSerif = Noto_Serif_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-noto-tamil-serif",
  display: "swap",
});

const notoTamilSans = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-tamil-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair-latin",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta-latin",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-cinzel-latin",
  display: "swap",
});

// next/font emits one variable per family; marketing.css consumes the composed
// stacks below, so a Tamil string in any of the three roles falls through to
// the matching Noto face rather than to a system font. Each Tamil face is
// paired with the Latin role it belongs to: serif behind the two heading
// roles, sans behind body.
const FONT_STACKS = {
  "--font-playfair": "var(--font-playfair-latin), var(--font-noto-tamil-serif)",
  "--font-cinzel": "var(--font-cinzel-latin), var(--font-noto-tamil-serif)",
  "--font-jakarta": "var(--font-jakarta-latin), var(--font-noto-tamil-sans)",
} as React.CSSProperties;

const fontVariables = [
  playfair.variable,
  jakarta.variable,
  cinzel.variable,
  notoTamilSerif.variable,
  notoTamilSans.variable,
].join(" ");

const OG_IMAGE = { ...DEFAULT_OG_IMAGE, alt: siteConfig.name };

// Google AdSense. This lives in the marketing root layout and nowhere else —
// the admin console has its own separate root layout (app/(admin)/layout.tsx),
// so staff pages never load an ad script and never report a pageview. That
// separation is free here; do not hoist this into a shared layout.
//
// The same tag covers three jobs: site verification during review, Auto Ads
// once enabled in the AdSense dashboard, and the loader for any manual
// <ins class="adsbygoogle"> unit added later. Placement, formats and page
// exclusions are all dashboard settings, not code.
//
// afterInteractive, not beforeInteractive: this must not block hydration of a
// page whose first impression is an animated hero.
//
// ads.txt (public/ads.txt) has to stay in sync with this publisher ID, or
// AdSense reports "Earnings at risk".
const ADSENSE_CLIENT = "ca-pub-5905899581811953";

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
    <html
      lang={locale}
      className={`${fontVariables} font-body-md`}
      style={{ colorScheme: "dark", ...FONT_STACKS }}
    >
      <body className="antialiased min-h-screen flex flex-col relative bg-background text-on-background">
        <NextIntlClientProvider messages={messages}>
          <MotionConfig reducedMotion="user">
            <Navbar />
            <main className="min-h-screen relative">{children}</main>
            <JoinModal />
            <RenewModal />
          </MotionConfig>
        </NextIntlClientProvider>
        <Script
          id="adsbygoogle"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      </body>
    </html>
  );
}
