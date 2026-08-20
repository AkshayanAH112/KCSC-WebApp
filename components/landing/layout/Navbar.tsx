"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const lastScrollY = useRef(0);

  useEffect(() => {
      // Ensure we don't carry over stale scroll values between route changes
      lastScrollY.current = window.scrollY;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        setIsScrolled(currentScrollY > 10);

        if (pathname === "/") {
          // Scroll Spy Logic
          const sections = navLinks.map(link => link.href.replace('/#', ''));
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
        }

        // Hide on scroll down, show on scroll up
        // Do this AFTER Scroll Spy so we don't accidentally use stale state
        setIsHidden((prev) => {
           if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
             return true;
           } else if (currentScrollY < lastScrollY.current) {
             return false;
           }
           return prev;
        });
        
        lastScrollY.current = currentScrollY;
      };
      
      const handleModalToggle = (e: any) => {
        setIsModalOpen(e.detail.isOpen);
      };

      window.addEventListener("scroll", handleScroll);
      window.addEventListener("modal-toggle", handleModalToggle);
      
      // Also update immediately if pathname changes but scroll doesn't happen
      if (pathname !== "/") {
        const currentNav = navLinks.find(link => link.href.startsWith('/') && pathname.startsWith(link.href) && link.href !== '/#home');
        setActiveSection(currentNav ? currentNav.label : "");
      } else {
        handleScroll();
      }

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("modal-toggle", handleModalToggle);
      };
    }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      if (pathname === "/") {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        const id = href.replace("/", "");
        const target = document.querySelector(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        setIsMobileMenuOpen(false);
      }
    } else {
      setIsMobileMenuOpen(false);
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
          "fixed top-0 left-0 w-full z-50 pointer-events-none transition-all duration-500 ease-in-out",
          (isHidden || isModalOpen) ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <nav
          className={cn(
            "pointer-events-auto w-full transition-all duration-500 flex items-center px-5 md:px-12 border-b",
            isScrolled
              ? "bg-surface/90 backdrop-blur-xl border-outline-variant/50 shadow-sm py-3"
              : "bg-transparent border-transparent py-5 md:py-6"
          )}
        >
          {/* Left: Logo */}
          <div className="flex-1 flex items-center justify-start">
            <Link
              href="/#home"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              onClick={(e) => handleNavClick(e, "/#home")}
            >
              <KcscMark />
            </Link>
          </div>

          {/* Center: Desktop Nav Links */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "relative text-[15px] font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:text-primary",
                  activeSection === link.label
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: CTA & Mobile Menu Toggle */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <Button 
              className={cn(
                "hidden md:inline-flex rounded-full shadow-soft transition-all duration-300",
                isScrolled ? "px-6" : "px-8"
              )}
              onClick={handleJoinClick}
            >
              Join The Club
            </Button>

            <button
              className="cursor-pointer md:hidden text-on-surface p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full bg-surface shadow-sm border border-outline-variant/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-surface/98 backdrop-blur-md pt-28 px-5 md:hidden flex flex-col gap-6 overflow-y-auto pb-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-2xl font-display font-bold transition-colors",
                activeSection === link.label ? "text-primary" : "text-on-surface-variant"
              )}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {link.label}
            </Link>
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
