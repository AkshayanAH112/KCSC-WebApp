import Link from "next/link";
import { Phone, MapPin, Mail } from "lucide-react";
import Image from "next/image";
import RenewLink from "@/components/landing/ui/RenewLink";
import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const locale = useLocale();
  return (
    <footer id="contact" className="relative py-4 md:py-6 overflow-hidden border-t border-outline-variant/30 bg-surface/80 backdrop-blur-md pointer-events-auto">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col md:flex-row justify-between gap-6 md:gap-4">
        
        {/* Brand Section */}
        <div className="flex flex-col gap-2 max-w-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-full shadow-soft bg-surface border border-outline-variant/30">
              <Image src="/Logo.jpeg" alt="KCSC Logo" fill className="object-contain" />
            </div>
            <div className="leading-tight">
              <span className="block text-[14px] font-bold text-primary tracking-[0.15em] uppercase">
                Kallar Central
              </span>
              <span className="block text-[14px] font-bold text-primary tracking-[0.15em] uppercase">
                Sports Club
              </span>
            </div>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-display font-bold text-on-surface">{t("contact")}</h3>
          
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Periyakallar+srilanka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-on-surface-variant hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-full bg-surface-container-high group-hover:bg-primary/10 transition-colors -mt-1">
                  <MapPin size={18} className="text-on-surface-variant group-hover:text-primary" />
                </div>
                <span>Periyakallar<br />Sri Lanka</span>
              </a>
            </li>
            
            <li>
              <a 
                href="tel:+94777770023"
                className="flex items-center gap-3 text-on-surface-variant hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-full bg-surface-container-high group-hover:bg-primary/10 transition-colors">
                  <Phone size={18} className="text-on-surface-variant group-hover:text-primary" />
                </div>
                <span>+94 777770023</span>
              </a>
            </li>

            <li>
              <a 
                href="mailto:kallarcentralsportsclub@gmail.com"
                className="flex items-center gap-3 text-on-surface-variant hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-full bg-surface-container-high group-hover:bg-primary/10 transition-colors shrink-0">
                  <Mail size={18} className="text-on-surface-variant group-hover:text-primary" />
                </div>
                <span className="break-all md:break-normal">kallarcentralsportsclub@gmail.com</span>
              </a>
            </li>

            <li>
              <a 
                href="https://www.facebook.com/kallarcentral.sportsclub/#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-on-surface-variant hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-full bg-surface-container-high group-hover:bg-primary/10 transition-colors">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-on-surface-variant group-hover:text-primary"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </div>
                <span>Kallar Central Sports Club</span>
              </a>
            </li>
          </ul>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-display font-bold text-on-surface">{t("quick_links")}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link href="#home" className="text-on-surface-variant hover:text-primary transition-colors">
                {t("link_home")}
              </Link>
            </li>
            <li>
              <Link href="#about" className="text-on-surface-variant hover:text-primary transition-colors">
                {t("link_about")}
              </Link>
            </li>
            <li>
              <Link href="#gallery" className="text-on-surface-variant hover:text-primary transition-colors">
                {t("link_gallery")}
              </Link>
            </li>
            <li>
              <Link href="#news" className="text-on-surface-variant hover:text-primary transition-colors">
                {t("link_news")}
              </Link>
            </li>
            <li>
              <RenewLink className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" />
            </li>
            <li>
              <Link href={`/${locale}/login`} className="text-on-surface-variant hover:text-primary transition-colors">
                {t("admin")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 mt-4 pt-4 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-on-surface-variant/70">
        <p>&copy; {new Date().getFullYear()} {t("copyright")}</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-primary transition-colors">{t("privacy")}</Link>
          <Link href="#" className="hover:text-primary transition-colors">{t("terms")}</Link>
        </div>
      </div>
    </footer>
  );
}
