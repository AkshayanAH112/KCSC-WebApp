import HeroSection from "@/components/landing/HeroSection";
import ClubIntro from "@/components/landing/ClubIntro";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
import Gallery from "@/components/landing/Gallery";
import News from "@/components/landing/News";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/layout/Footer";
import GlobalCinematicExperience from "@/components/landing/GlobalCinematicExperience";

export default function Home() {
  return (
    <GlobalCinematicExperience>
      <HeroSection />
      <ClubIntro />
      <ProgramsSection />
      <AchievementsSection />
      <Gallery />
      <News />
      <FinalCTA />
      <Footer />
    </GlobalCinematicExperience>
  );
}
