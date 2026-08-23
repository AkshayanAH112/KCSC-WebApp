import { cn } from "@/lib/utils";

export default function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-luxury shadow-soft rounded-2xl transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}
