import { Shield, Clock, UserX, Zap } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Private",
    desc: "Files are shared with unique access codes. No public listing, no indexing.",
    delay: "animate-fade-up-delay-1",
  },
  {
    icon: Clock,
    title: "Temporary",
    desc: "Set expiry and let uploads disappear automatically when time's up.",
    delay: "animate-fade-up-delay-2",
  },
  {
    icon: UserX,
    title: "No Accounts",
    desc: "Skip sign-ups. Share instantly and keep the flow simple.",
    delay: "animate-fade-up-delay-3",
  },
  {
    icon: Zap,
    title: "Fast",
    desc: "Optimized uploads and lean delivery for a smooth experience.",
    delay: "animate-fade-up-delay-3",
  },
];

export default function FeatureCards() {
  return (
    <section id="about" className="section-padding py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className={`glass glass-card elevate-soft tile-breathe ${f.delay} group relative overflow-hidden min-h-40 grid place-items-center text-center`}
              >
                <div className="flex flex-col items-center justify-center transition-opacity duration-300 ease-out group-hover:opacity-0">
                  <Icon className="w-7 h-7 text-muted-foreground icon-glow" />
                  <div className="mt-2 text-lg font-semibold">
                    {f.title}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-sm text-white/85 transition-all duration-300 ease-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                  {f.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
