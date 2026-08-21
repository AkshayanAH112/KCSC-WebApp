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
              ? "bg-surface/90 backdrop-blur-xl border-outline-variant/50 shadow-sm py-3"
              : "bg-transparent border-transparent py-5 md:py-6"
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

          {/* Center: Desktop Nav Links */}
          <div className={cn("hidden md:flex items-center justify-center", isTamil ? "gap-4" : "gap-8")}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={`/${locale}${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "relative font-semibold transition-colors duration-300 focus-visible:outline-none whitespace-nowrap",
                  isTamil ? "text-[13px]" : "text-[15px]",
                  activeSection === link.label
                    ? "text-primary"
                    : (isScrolled || !isHomePage)
                      ? "text-on-surface-variant hover:text-primary"
                      : "text-white/80 hover:text-white"
                )}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Right: CTA & Mobile Menu Toggle */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            <LanguageSwitcher isScrolled={isScrolled || !isHomePage} />
            
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
              href={`/${locale}${link.href}`}
              className={cn(
                  "font-display font-bold transition-colors",
                  isTamil ? "text-xl" : "text-2xl",
                  activeSection === link.label ? "text-primary" : "text-on-surface-variant"
                )}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="h-px w-full bg-outline-variant/50 my-2" />
          <Button size="lg" className="w-full justify-center rounded-full" onClick={handleJoinClick}>
            {t("join")}
          </Button>
        </div>
      )}
    </>
  );
}
