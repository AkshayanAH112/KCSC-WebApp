import VideoScrubHero from "@/components/landing/VideoScrubHero";
import ClubIntro from "@/components/landing/ClubIntro";
import ProgramsSection from "@/components/landing/ProgramsSection";
import Gallery from "@/components/landing/Gallery";
import News from "@/components/landing/News";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/layout/Footer";
import { getLocale } from "next-intl/server";
import { siteConfig } from "@/lib/constants";
import { localeAlternates, DEFAULT_OG_IMAGE } from "@/lib/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return { alternates: localeAlternates("", locale) };
}

// Two linked entities in one graph.
//
// WebSite is what Google's "site names" feature reads to decide what to print
// above the title in a result — without it, it falls back to the bare domain
// ("kallarcentralsc.com" rather than "Kallar Central Sports Club"). It has to
// be on the homepage, and its `name` is the string Google shows.
//
// SportsOrganization is schema.org's actual type for a club like this (there
// is no "SportsClub" type) — it describes the entity itself, separate from any
// one page's content. The @id references tie the two together so Google reads
// them as one site published by one organisation, rather than as two
// unrelated blobs.
const SITE_ID = `${siteConfig.url}/#website`;
const ORG_ID = `${siteConfig.url}/#organization`;

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      name: siteConfig.name,
      alternateName: [siteConfig.shortName, "பெரியகல்லாறு மத்திய விளையாட்டுக் கழகம்"],
      url: siteConfig.url,
      publisher: { "@id": ORG_ID },
    },
    {
  "@type": "SportsOrganization",
  "@id": ORG_ID,
  name: siteConfig.name,
  alternateName: siteConfig.shortName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  image: `${siteConfig.url}${DEFAULT_OG_IMAGE.url}`,
  description: siteConfig.description,
  foundingDate: "2007",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Periyakallar",
    addressCountry: "LK",
  },
  telephone: "+94777770023",
  email: "kallarcentralsportsclub@gmail.com",
  sameAs: ["https://www.facebook.com/kallarcentral.sportsclub/"],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
      />
      <VideoScrubHero />
      <ClubIntro />
      <ProgramsSection />
      <Gallery />
      <News />
      <FinalCTA />
      <Footer />
    </>
  );
}
