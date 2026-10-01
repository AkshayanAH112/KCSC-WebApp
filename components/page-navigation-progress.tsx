"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showLogoPulse, setShowLogoPulse] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  // Clear all pending timers
  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    timerRef.current = null;
    logoTimerRef.current = null;
    safetyTimerRef.current = null;
  };

  const startNavigation = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    clearAllTimers();

    setVisible(true);
    setProgress(15);

    // Increment progress incrementally to feel responsive
    let current = 15;
    timerRef.current = setInterval(() => {
      current += Math.max(1, (90 - current) * 0.15);
      if (current >= 90) {
        current = 90;
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setProgress(Math.round(current));
    }, 180);

    // Show the subtle KCSC logo pulse only on transitions longer than 220ms
    logoTimerRef.current = setTimeout(() => {
      if (isNavigatingRef.current) {
        setShowLogoPulse(true);
      }
    }, 220);

    // Safety timeout: automatically reset after 8s if something gets stuck
    safetyTimerRef.current = setTimeout(() => {
      finishNavigation();
    }, 8000);
  };

  const finishNavigation = () => {
    isNavigatingRef.current = false;
    clearAllTimers();

    setProgress(100);
    setShowLogoPulse(false);

    // Gracefully fade out
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 250);
  };

  // Route change completion: when pathname or searchParams updates
  useEffect(() => {
    if (isNavigatingRef.current || visible) {
      finishNavigation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Intercept click on links to start navigation immediately
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as Element)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore modifiers (ctrl/cmd click, middle click, etc.)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Ignore target="_blank", downloads, or non-HTTP protocols
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Parse target URL
      let targetUrl: URL;
      try {
        targetUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Ignore external domains
      if (targetUrl.origin !== window.location.origin) return;

      // Ignore hash-only anchors or same-page anchors
      const currentUrl = new URL(window.location.href);
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search
      ) {
        return;
      }

      startNavigation();
    };

    const handlePopState = () => {
      startNavigation();
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearAllTimers();
    };
  }, []);

  return (
    <>
      {/* Top glowing progress bar */}
      <div
        role="progressbar"
        aria-hidden="true"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`fixed top-0 left-0 right-0 h-[3.5px] z-[999999] pointer-events-none transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full relative transition-[width] duration-200 ease-out"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, #720000 0%, #b91c1c 35%, #f59e0b 75%, #fde68a 100%)",
            boxShadow:
              "0 0 12px rgba(251, 191, 36, 0.8), 0 0 6px rgba(185, 28, 28, 0.9)",
          }}
        >
          {/* Leading bright glowing dot at the head of the progress bar */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-200 blur-[2px] shadow-[0_0_8px_#fbbf24]" />
        </div>
      </div>

      {/* Subtle KCSC Logo Pulse for transitions taking >220ms */}
      <aside
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-[999998] pointer-events-none transition-all duration-300 ease-out transform ${
          showLogoPulse
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-95"
        }`}
      >
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-[#140507]/90 dark:bg-black/90 backdrop-blur-md border border-[#fbbf24]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(251,191,36,0.2)]">
          {/* Animated crest container */}
          <div className="relative w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-black/60 shrink-0">
            {/* Pulsing ring around the crest */}
            <span className="absolute inset-0 rounded-full border border-[#fbbf24]/60 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#720000]/60 to-[#fbbf24]/30 animate-pulse" />
            <Image
              src="/logo-mark.png"
              alt="KCSC"
              width={22}
              height={22}
              className="object-contain relative z-10"
              priority
            />
          </div>

          <div className="flex flex-col pr-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#fde68a] leading-tight flex items-center gap-1.5">
              Loading
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-[#fde68a] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 rounded-full bg-[#fde68a] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 rounded-full bg-[#fde68a] animate-bounce" />
              </span>
            </span>
            <span className="text-[9px] text-[#c9bdb8] font-medium leading-none">
              Kallar Central
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function PageNavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
