import { getLocale, getTranslations } from "next-intl/server";
import LiveHome from "@/components/landing/live/LiveHome";
import LivePageShell, { liveMetadata } from "@/components/landing/live/LivePageShell";

// No DB read at render — like /results, this is a static shell and the scores
// arrive client-side from GET /api/public/cricket, which is what gets polled.

export async function generateMetadata() {
  return liveMetadata("/live");
}

export default async function LivePage() {
  const locale = await getLocale();
  const t = await getTranslations("Live");
  const isTamil = locale === "ta";

  return (
    <LivePageShell path="/live">
      <header className="mb-10">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.2em] text-tertiary-container">
          {t("eyebrow")}
        </span>
        {/* Tamil drops a size step, as on /results: its compounds are single
            unbreakable words that overflow at the Latin heading size. */}
        <h1
          className={`font-display font-extrabold leading-tight tracking-tight wrap-break-word text-on-primary-container ${
            isTamil ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl md:text-5xl"
          }`}
        >
          {t("title")}
          <span className="block text-gradient-gold">{t("accent")}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">{t("description")}</p>
      </header>

      <LiveHome />
    </LivePageShell>
  );
}
