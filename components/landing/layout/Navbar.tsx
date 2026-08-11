"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { navLinks } from "@/lib/constants";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/landing/ui/Button";

function KcscMark() {
  return (
    <div className="flex items-center gap-3 pl-1">
      <div className="relative w-11 h-11 shrink-0 overflow-hidden rounded-full shadow-soft bg-surface border border-outline-variant/30">
        <Image src="/Logo.jpeg" alt="KCSC Logo" fill className="object-contain" />
      </div>
      <div className="leading-tight hidden sm:block">
        <span className="block text-[11px] font-bold text-primary tracking-[0.15em] uppercase">
          Kallar Central
        </span>
        <span className="block text-[11px] font-bold text-primary tracking-[0.15em] uppercase">
          Sports Club
        </span>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 50);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHidden(false);
      }
      
      lastScrollY.current = currentScrollY;

      // Scroll Spy Logic
      const sections = navLinks.map(link => link.href.replace('#', ''));
      let current = "Home"; // default
      for (const section of sections) {
        if (!section || section === '/') continue;
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold based on section sizing
          if (rect.top <= 300 && rect.bottom >= 300) {
            current = navLinks.find(l => l.href.includes(section))?.label || "Home";
          }
        }
      }
      if (currentScrollY < 100) current = "Home";
      
      setActiveSection(current);
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("open-join-modal"));
  };

  return (
    <>
      <div 
        className={cn(
          "fixed top-4 left-0 w-full z-50 flex justify-center px-4 pointer-events-none transition-transform duration-500",
          isHidden ? "-translate-y-[150%]" : "translate-y-0"
        )}
      >
        <nav
          className={cn(
            "pointer-events-auto transition-all duration-500 flex items-center justify-between rounded-full",
            isScrolled
              ? "w-full max-w-[800px] bg-surface/85 backdrop-blur-xl border border-outline-variant shadow-elevated py-2 px-3"
              : "w-full max-w-[1280px] bg-surface/40 backdrop-blur-md border border-outline-variant/30 py-4 px-3"
          )}
        >
          <a
            href="#home"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full pl-1"
            onClick={(e) => handleNavClick(e, "#home")}
          >
            <KcscMark />
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-surface-container-low/60 backdrop-blur-md rounded-full p-1 border border-outline-variant/40 shadow-soft">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "relative text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary px-5 py-2 rounded-full",
                  activeSection === link.label
                    ? "text-on-primary bg-primary shadow-md"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Primary Action CTA */}
          <Button 
            className={cn(
              "hidden md:inline-flex rounded-full shadow-soft transition-all duration-300",
              isScrolled ? "px-6" : "px-8"
            )}
            onClick={handleJoinClick}
          >
            Join The Club
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="cursor-pointer md:hidden text-on-surface p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full bg-surface shadow-sm border border-outline-variant/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-surface/98 backdrop-blur-md pt-28 px-5 md:hidden flex flex-col gap-6 overflow-y-auto pb-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "text-2xl font-display font-bold transition-colors",
                activeSection === link.label ? "text-primary" : "text-on-surface-variant"
              )}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          <div className="h-px w-full bg-outline-variant/50 my-2" />
          <Button size="lg" className="w-full justify-center rounded-full" onClick={handleJoinClick}>
            Join The Club
          </Button>
        </div>
      )}
    </>
  );
}
