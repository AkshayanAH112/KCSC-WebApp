"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// The navbar used to pass `isScrolled` so this could swap between light
// chrome and white-on-video; with a single dark theme both branches resolve to
// the same treatment, so the prop is gone rather than left inert.
export default function LanguageSwitcher() {
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
          "relative flex items-center gap-1.5 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-full whitespace-nowrap",
          open ? "text-tertiary-container" : "text-on-surface-variant hover:text-tertiary-container"
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
            "absolute top-[calc(100%+12px)] right-0 z-50 w-32 rounded-xl overflow-hidden py-1.5 transition-all duration-300 shadow-elevated backdrop-blur-xl animate-in fade-in slide-in-from-top-2",
            "bg-surface-container/90 border border-tertiary-container/25"
          )}
        >
          <button
            onClick={() => switchLanguage("en")}
            className={cn(
              "w-full text-left px-4 py-2 text-[14px] font-semibold transition-colors duration-200",
              locale === "en"
                ? "text-tertiary-container"
                : "text-on-surface-variant hover:text-on-primary-container hover:bg-primary-container/40"
            )}
          >
            English
          </button>
          
          <button
            onClick={() => switchLanguage("ta")}
            className={cn(
              "w-full text-left px-4 py-2 text-[14px] font-semibold transition-colors duration-200",
              locale === "ta"
                ? "text-tertiary-container"
                : "text-on-surface-variant hover:text-on-primary-container hover:bg-primary-container/40"
            )}
          >
            தமிழ்
          </button>
        </div>
      )}
    </div>
  );
}
