import { cn } from "@/lib/cn";

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
            "text-xs font-semibold tracking-[0.2em] uppercase",
            light ? "text-tertiary-container" : "text-secondary-fixed"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight",
          light ? "text-on-tertiary" : "text-on-background"
        )}
      >
        {title}
        {accent && <span className="block text-gradient-gold">{accent}</span>}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-xl text-base leading-relaxed",
            light ? "text-tertiary-fixed" : "text-on-surface-variant",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
