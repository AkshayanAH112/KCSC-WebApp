"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/constants";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/landing/ui/Button";
import LanguageSwitcher from "@/components/landing/layout/LanguageSwitcher";
import { useTranslations, useLocale } from "next-intl";

function KcscMark() {
  return (
    <div className="group flex items-center gap-3 pl-1">
      {/* The crest is maroon line art and needs a light plate — on the dark
          navbar it would be maroon on near-black. logo-mark.png is the crest
          with its outer white made transparent and cropped to the artwork, so
          the plate matches its 543:640 proportions and no dead margin shows
          inside the box. Logo.jpeg keeps its original white canvas and is
          still the news-card fallback image. */}
      <div className="relative h-11 aspect-[543/640] shrink-0 overflow-hidden rounded-lg border border-tertiary-container/40 bg-inverse-surface shadow-soft transition-colors group-hover:border-tertiary-container">
        <Image src="/logo-mark.png" alt="KCSC Logo" fill className="object-contain" />
      </div>
      {/* Cinzel is reserved for the wordmark — it is the one place the design
          wants an inscriptional serif, and using it anywhere else would flatten
          the distinction between the mark and ordinary headings. */}
      <div className="leading-none hidden sm:block">
        <span className="block font-crest text-sm font-bold text-on-primary-container tracking-wider uppercase transition-colors group-hover:text-on-primary">
          Kallar Central
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold text-tertiary-container/80 tracking-widest uppercase">
          Sports Club
        </span>
      </div>
    </div>
  );
}

export default function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const isTamil = locale === "ta";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/" || pathname === `/${locale}`;
  
  const lastScrollY = useRef(0);

  useEffect(() => {
      // Ensure we don't carry over stale scroll values between route changes
      lastScrollY.current = window.scrollY;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        setIsScrolled(currentScrollY > 10);

        if (isHomePage) {
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
      if (!isHomePage) {
        const normalizedPath = pathname.replace(`/${locale}`, "") || "/";
        const currentNav = navLinks.find(link => link.href.startsWith('/') && normalizedPath.startsWith(link.href) && link.href !== '/#home');
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
      if (isHomePage) {
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
            isScrolled || !isHomePage
              ? "bg-background/90 backdrop-blur-xl border-tertiary-container/20 shadow-elevated py-3"
              : "bg-linear-to-b from-background/90 via-background/50 to-transparent border-transparent py-5 md:py-6"
          )}
        >
          {/* Left: Logo */}
          <div className="flex-1 flex items-center justify-start">
            <Link
              href={`/${locale}/#home`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              onClick={(e) => handleNavClick(e, "/#home")}
            >
              <KcscMark />
            </Link>
          </div>

          {/* Center: Desktop Nav Links. These stay real page routes
              (/about, /gallery, /news) plus the /#home anchor — the pill
              styling is cosmetic and does not change where anything goes. */}
          <div
            className={cn(
              "hidden md:flex items-center justify-center rounded-full border border-tertiary-container/15 bg-surface-container/60 backdrop-blur-md shadow-inner",
              isTamil ? "gap-1 px-3 py-1.5" : "gap-1 px-4 py-1.5"
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={`/${locale}${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary whitespace-nowrap",
                  isTamil ? "text-[12px]" : "text-[13px]",
                  activeSection === link.label
                    ? "bg-linear-to-r from-primary-container/90 to-surface-container-lowest text-tertiary-container border border-tertiary-container/30"
                    : "text-on-surface-variant hover:text-on-primary-container hover:bg-primary-container/40"
                )}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Right: CTA & Mobile Menu Toggle */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            <LanguageSwitcher />
            
            <Button 
              className={cn(
                "hidden md:inline-flex rounded-full shadow-soft transition-all duration-300",
                isTamil ? "text-[12px] px-4" : (isScrolled || !isHomePage) ? "px-6" : "px-8"
              )}
              onClick={handleJoinClick}
            >
              {t("join")}
            </Button>

            <button
              className="cursor-pointer md:hidden text-tertiary-container p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg bg-primary-container/50 border border-tertiary-container/30 hover:text-on-primary transition-colors"
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
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-md pt-28 px-5 md:hidden flex flex-col gap-6 overflow-y-auto pb-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={`/${locale}${link.href}`}
              className={cn(
                  "font-display font-bold transition-colors",
                  isTamil ? "text-xl" : "text-2xl",
                  activeSection === link.label ? "text-tertiary-container" : "text-on-surface-variant hover:text-on-primary-container"
                )}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="h-px w-full bg-tertiary-container/20 my-2" />
          <Button size="lg" className="w-full justify-center rounded-full" onClick={handleJoinClick}>
            {t("join")}
          </Button>
        </div>
      )}
    </>
  );
}
