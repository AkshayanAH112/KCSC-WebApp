import VideoScrubHero from "@/components/landing/VideoScrubHero";
import ClubIntro from "@/components/landing/ClubIntro";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
import Gallery from "@/components/landing/Gallery";
import News from "@/components/landing/News";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/layout/Footer";

export default function Home() {
  return (
    <>
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
