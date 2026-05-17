import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/ui/reveal";

const institutions = [
  "Meridian University",
  "Northgate Institute of Technology",
  "Crestwood Polytechnic",
  "Vanguard School of Engineering",
  "Halton State University",
  "Ashford Institute of Science",
  "Brightland College",
  "Pinnacle Technical University",
];

export function TrustStrip() {
  return (
    <section className="border-y border-line py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-center font-mono text-[0.68rem] uppercase tracking-[0.22em] text-fg-subtle">
            Trusted by examination cells at leading institutions
          </p>
        </Reveal>
        <div className="mt-7">
          <Marquee>
            {institutions.map((name) => (
              <div key={name} className="flex items-center gap-10 px-5">
                <span className="whitespace-nowrap text-[0.95rem] font-medium text-fg-muted/80">
                  {name}
                </span>
                <span className="h-1 w-1 rounded-full bg-fg-subtle/50" />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
