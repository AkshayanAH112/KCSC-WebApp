import HeroSection from "@/components/landing/HeroSection";
import ClubIntro from "@/components/landing/ClubIntro";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
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
      <FinalCTA />
      <Footer />
    </GlobalCinematicExperience>
  );
}
