import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function AboutImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant/50">
      <ImageIcon size={40} strokeWidth={1.5} className="opacity-60" />
      <span className="px-6 text-center text-sm font-semibold tracking-wide uppercase">{label}</span>
    </div>
  );
}

export function AboutSection({
  eyebrow,
  title,
  body,
  reverse = false,
  imagePlaceholderLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  reverse?: boolean;
  imagePlaceholderLabel: string;
}) {
  // Section bodies carry multiple paragraphs joined by a blank line in the
  // translation string (JSON can't hold literal newlines) — split back out here.
  const paragraphs = body.split("\n\n");

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(reverse ? "lg:order-2" : "lg:order-1")}>
        <AboutImagePlaceholder label={imagePlaceholderLabel} />
      </div>
      <div className={cn("flex flex-col gap-4", reverse ? "lg:order-1" : "lg:order-2")}>
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary-fixed uppercase">{eyebrow}</span>
        <h3 className="font-display text-2xl font-bold tracking-tight text-on-background md:text-3xl">{title}</h3>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-on-surface-variant">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
