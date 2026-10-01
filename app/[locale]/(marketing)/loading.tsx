import Image from "next/image";

export default function MarketingLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 relative z-20">
      {/* Background radial glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#720000]/20 via-[#fbbf24]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Branded loading card */}
      <div className="relative flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#140507]/80 border border-[#fbbf24]/20 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Animated crest container */}
        <div className="relative w-20 h-20 rounded-2xl p-3 bg-gradient-to-b from-[#23090d] to-[#120608] border border-[#fbbf24]/40 flex items-center justify-center shadow-inner">
          {/* Pulsing rings */}
          <span className="absolute -inset-1.5 rounded-2xl border border-[#fbbf24]/40 animate-ping opacity-40 pointer-events-none" />
          <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-[#720000]/40 to-[#fbbf24]/30 animate-pulse pointer-events-none" />
          
          <Image
            src="/logo-mark.png"
            alt="Kallar Central Sports Club"
            width={56}
            height={56}
            className="object-contain relative z-10 drop-shadow-md"
            priority
          />
        </div>

        {/* Text and animated indicator */}
        <div className="flex flex-col items-center text-center gap-2">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#fde68a] flex items-center gap-2">
            Loading
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-bounce" />
            </span>
          </span>
          <span className="text-xs text-[#c9bdb8] tracking-wider font-medium">
            Kallar Central Sports Club
          </span>
        </div>
      </div>
    </div>
  );
}
