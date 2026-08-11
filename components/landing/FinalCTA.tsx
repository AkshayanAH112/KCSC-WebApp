"use client";

import Button from "@/components/landing/ui/Button";

export default function FinalCTA() {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-join-modal"));
  };

  return (
    <section id="join" className="relative min-h-[100vh] flex flex-col justify-center py-24 md:py-32 overflow-hidden">
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col items-center text-center gap-8">
        <h2 className="text-4xl md:text-6xl font-display font-bold text-on-background tracking-tight mb-6">
          Your Next Innings Starts Here.
        </h2>

        <p className="text-lg md:text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
          Whether you&apos;re looking to learn the basics, play competitively, or just be part of a great community—KCSC has a place for you.
        </p>

        <Button
          size="lg"
          className="bg-primary text-on-primary hover:bg-primary-hover shadow-elevated"
          onClick={handleJoinClick}
        >
          Join The Club
        </Button>
      </div>
    </section>
  );
}
