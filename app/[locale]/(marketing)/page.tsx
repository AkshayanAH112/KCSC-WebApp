import VideoScrubHero from "@/components/landing/VideoScrubHero";
import ClubIntro from "@/components/landing/ClubIntro";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
import Gallery from "@/components/landing/Gallery";
import News from "@/components/landing/News";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/layout/Footer";
import { siteConfig } from "@/lib/constants";
import { localeAlternates, DEFAULT_OG_IMAGE } from "@/lib/seo";

export async function generateMetadata() {
  return { alternates: localeAlternates("") };
}

// SportsOrganization is schema.org's actual type for a club like this (there
// is no "SportsClub" type) — helps Google understand the entity itself,
// separate from any one page's content.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
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
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <VideoScrubHero />
      <ClubIntro />
      <ProgramsSection />
      <AchievementsSection />
      <Gallery />
      <News />
      <FinalCTA />
      <Footer />
    </>
  );
}
