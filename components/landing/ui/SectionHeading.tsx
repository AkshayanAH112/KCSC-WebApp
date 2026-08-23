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
          "font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-tight",
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
