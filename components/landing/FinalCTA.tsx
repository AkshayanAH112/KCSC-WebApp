"use client";

import Button from "@/components/landing/ui/Button";

export default function FinalCTA() {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-join-modal"));
  };

  return (
    <section id="join" className="relative flex flex-col justify-center pt-32 pb-12 md:pt-48 md:pb-16 overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sections/finalcta-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Base darken, so the photo never sits raw behind the page. */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Centered radial scrim, so the CTA text stays legible regardless of
            what the photo is doing directly behind it. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(5,5,10,.72) 0%, rgba(5,5,10,.42) 55%, rgba(5,5,10,0) 85%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col items-center text-center gap-6">
        <h2
          className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight"
          style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78), 0 10px 44px rgba(5,5,10,.8)" }}
        >
          Your Next Innings Starts Here.
        </h2>

        <p
          className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-snug"
          style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78)" }}
        >
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
