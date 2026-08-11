import SectionHeading from "@/components/ui/SectionHeading";

export default function ClubIntro() {
  return (
    <section id="about" className="relative min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <SectionHeading
          eyebrow="About KCSC"
          title="More Than a Club."
          accent="A Cricket Legacy."
          description="Kallar Central Sports Club was built on a simple idea: that cricket, played with discipline and pride, builds character as much as it builds skill. From junior development to competitive senior cricket, every player who wears the badge becomes part of a community committed to the game."
        />
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Community", desc: "A club built by and for its members." },
            { label: "Development", desc: "Structured pathways from junior to senior cricket." },
            { label: "Discipline", desc: "Professional coaching, real standards." },
            { label: "Competition", desc: "Playing with purpose, representing the badge." },
          ].map((item) => (
            <div key={item.label} className="card-surface shadow-soft rounded-2xl p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
                {item.label}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
