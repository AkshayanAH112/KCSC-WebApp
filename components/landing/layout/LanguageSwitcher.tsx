"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  isScrolled?: boolean;
}

export default function LanguageSwitcher({ isScrolled = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (nextLocale: string) => {
    if (nextLocale === locale) { setOpen(false); return; }
    let newPath = pathname;
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    } else if (pathname === "/") {
      newPath = `/${nextLocale}`;
    }
    setOpen(false);
    router.push(newPath);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative flex items-center">
      {/* World Icon Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center gap-1.5 font-semibold transition-colors duration-200 focus-visible:outline-none whitespace-nowrap",
          open
            ? "text-primary"
            : isScrolled
              ? "text-on-surface-variant hover:text-primary"
              : "text-white/80 hover:text-white"
        )}
      >
        <Globe size={18} />
        <span className="hidden lg:block text-[13px] tracking-wide uppercase font-bold">
          {locale === "en" ? "EN" : "TA"}
        </span>
      </button>

      {/* Liquid Glass Dropdown */}
      {open && (
        <div 
          className={cn(
            "absolute top-[calc(100%+12px)] right-0 z-50 w-32 rounded-xl overflow-hidden py-1.5 transition-all duration-300 shadow-soft backdrop-blur-xl animate-in fade-in slide-in-from-top-2",
            // Liquid Glass adapting to the Navbar's current state
            isScrolled 
              ? "bg-surface/80 border border-outline-variant/40" 
              : "bg-black/10 border border-white/20"
          )}
        >
          <button
            onClick={() => switchLanguage("en")}
            className={cn(
              "w-full text-left px-4 py-2 text-[14px] font-semibold transition-colors duration-200",
              locale === "en" 
                ? "text-primary" 
                : isScrolled
                  ? "text-on-surface-variant hover:text-primary hover:bg-surface-container/50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            English
          </button>
          
          <button
            onClick={() => switchLanguage("ta")}
            className={cn(
              "w-full text-left px-4 py-2 text-[14px] font-semibold transition-colors duration-200",
              locale === "ta" 
                ? "text-primary" 
                : isScrolled
                  ? "text-on-surface-variant hover:text-primary hover:bg-surface-container/50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            தமிழ்
          </button>
        </div>
      )}
    </div>
  );
}
