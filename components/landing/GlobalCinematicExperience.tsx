"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import GlobalScene from "./GlobalScene";
import type { StoryRef } from "./BallAnimation";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SETTLED_PROGRESS = 0.5;

export default function GlobalCinematicExperience({ children }: { children: React.ReactNode }) {
  const storyRef = useRef<StoryRef>({
    scroll: 0,
    mouseX: 0,
    mouseY: 0,
    reducedMotion: false,
    mouseEnabled: true,
  });

  const [dpr, setDpr] = useState<[number, number]>([1, 2]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;

    storyRef.current.reducedMotion = reduced;
    storyRef.current.mouseEnabled = !reduced && !mobile;
    storyRef.current.scroll = reduced ? SETTLED_PROGRESS : 0;
    setDpr(mobile ? [1, 1.5] : [1, 2]);
  }, []);

  useGSAP(() => {
    if (storyRef.current.reducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        storyRef.current.scroll = self.progress;
      },
    });

    document.fonts?.ready?.then(() => ScrollTrigger.refresh());

    return () => trigger.kill();
  }, []);

  // Update mouse position on window
  useEffect(() => {
    if (!storyRef.current.mouseEnabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
      storyRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      storyRef.current.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-background">
        <Canvas
          camera={{ position: [0, 1, 10], fov: 55 }}
          dpr={dpr}
          frameloop="always"
          gl={{ alpha: false, antialias: true }}
          className="absolute inset-0"
        >
          <GlobalScene storyRef={storyRef} />
        </Canvas>
      </div>
      
      {/* HTML Content Overlay */}
      <div className="relative z-10 w-full flex flex-col">
        {children}
      </div>
    </>
  );
}
