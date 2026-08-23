import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  // Tamil compounds are single long words with no break opportunity —
  // "களுவாஞ்சிக்குடியின்" alone is wider than a half-width grid column at the
  // Latin heading size, and was overflowing ClubIntro's column into the stat
  // cards beside it. Tamil drops a step; break-words is the safety net so no
  // future string can overflow rather than wrap, in either language.
  const isTamil = useLocale() === "ta";

  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {eyebrow && (
        <span
          className={cn(
            "text-xs font-bold tracking-[0.2em] uppercase",
            light ? "text-tertiary-fixed" : "text-tertiary-container"
          )}
        >
          {eyebrow}
        </span>
      )}
      {/* Headings sit at the pale end of the gold ramp rather than pure white —
          the whole page is warm, and a neutral white headline reads as a
          different design system dropped on top of it. */}
      <h2
        className={cn(
          "font-display font-extrabold tracking-tight leading-tight wrap-break-word",
          isTamil ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl md:text-5xl",
          light ? "text-on-primary" : "text-on-primary-container"
        )}
      >
        {title}
        {accent && <span className="block text-gradient-gold">{accent}</span>}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-xl text-base leading-relaxed text-on-surface-variant",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
