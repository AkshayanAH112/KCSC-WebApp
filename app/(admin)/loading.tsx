import Image from "next/image";

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-md">
        <div className="relative w-16 h-16 rounded-xl p-2.5 bg-muted border border-border flex items-center justify-center">
          <span className="absolute -inset-1 rounded-xl border border-primary/30 animate-ping opacity-30" />
          <Image
            src="/logo-mark.png"
            alt="KCSC"
            width={44}
            height={44}
            className="object-contain relative z-10"
            priority
          />
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-xs uppercase tracking-widest font-semibold text-foreground flex items-center gap-1.5">
            Loading
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
            </span>
          </span>
          <span className="text-xs text-muted-foreground">KCSC Admin Portal</span>
        </div>
      </div>
    </div>
  );
}
