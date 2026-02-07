"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { LightRays } from "@/components/ui/light-rays";


export default function Home() {
  const [heroMode, setHeroMode] = useState<"home" | "projects" | "certifications" | "contact">("home");

const dev = (className: string) => (
  <i
    className={`${className} text-[1.05em] opacity-80`}
    aria-hidden="true"
  />
);

const tapeItems: { label: string; icon?: ReactNode }[] = [
  { label: "linux systems", icon: dev("devicon-linux-plain") },
  { label: "networking fundamentals" },

  { label: "c / c++", icon: dev("devicon-c-plain") },
  { label: "javascript", icon: dev("devicon-javascript-plain") },
  { label: "typescript", icon: dev("devicon-typescript-plain") },

  { label: "git & version control", icon: dev("devicon-git-plain") },
  { label: "docker", icon: dev("devicon-docker-plain") },

  { label: "aws basics", icon: dev("devicon-amazonwebservices-plain-wordmark") },

  { label: "systems thinking" },
  { label: "work in progress" },
];

  useEffect(() => {
    const getModeFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "projects" || hash === "certifications" || hash === "contact") {
        setHeroMode(hash);
      } else {
        setHeroMode("home");
      }
    };

    getModeFromHash();
    window.addEventListener("hashchange", getModeFromHash);
    return () => window.removeEventListener("hashchange", getModeFromHash);
  }, []);

  const heroContent = {
    home: {
      title: "Systems builder with a musician's ear for rhythm, timing, and flow.",
      body:
        "Computer science student focused on networking and systems. I care about clarity, reliability, and designing infrastructure and interfaces that behave predictably under real constraints.",
    },
    projects: {
      title: "Projects focused on reliability, performance, and control.",
      body:
        "A selection of systems, tools, and experiments I’ve built or am actively developing, with an emphasis on performance, resilience, and thoughtful interaction.",
    },
    certifications: {
      title: "Certifications and technical milestones.",
      body:
        "Formal credentials and learning milestones that support my hands-on work in networking, systems, and software fundamentals.",
    },
    contact: {
      title: "Always learning, always building.",
      body:
        "I approach systems and software as things to be studied, tested, and improved through real use.",
    },
  } as const;

  const currentHero = heroContent[heroMode];

  return (
    <>
      <header className="relative flex h-screen items-center justify-center overflow-hidden bg-[#121512]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,161,91,0.12),_transparent_55%)]" />

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-35">
  <LightRays
    count={12}
    color="rgba(116, 196, 166, 0.8)"
    blur={80}
    speed={18}
    length="700px"
    className="mix-blend-screen"
    style={{ transform: "translateY(-6%)" }}
  />
</div>



        <div className="ambient-orb-a absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#c6a15b]/15 blur-3xl" />
        <div className="ambient-orb-b absolute right-10 bottom-10 h-72 w-72 rounded-full bg-[#7b9e8b]/18 blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-0">
          <p className="text-sm uppercase tracking-[0.35em] text-white/60">
            Kevin A. Cruz
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            {currentHero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-white/75">
            {currentHero.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Systems-focused
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Infrastructure &amp; networks
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  Exploring networking &amp; infra
            </span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 z-10 space-y-2 px-4 md:px-6">
          <div
            className="tape-row rounded-md"
            style={{ "--tape-duration": "30s" } as CSSProperties}
          >
            <div className="tape-track tape-track--right">
              <div className="tape-repeat">
                {tapeItems.map((item, index) => (
                  <span key={`left-a-${index}`} className="tape-item">
                    {item.icon ? <span className="tape-icon">{item.icon}</span> : null}
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="tape-repeat" aria-hidden="true">
                {tapeItems.map((item, index) => (
                  <span key={`left-b-${index}`} className="tape-item">
                    {item.icon ? <span className="tape-icon">{item.icon}</span> : null}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            className="tape-row tape-row--alt rounded-md"
            style={{ "--tape-duration": "25s" } as CSSProperties}
          >
            <div className="tape-track tape-track--left">
              <div className="tape-repeat">
                {tapeItems.map((item, index) => (
                  <span key={`right-a-${index}`} className="tape-item">
                    {item.icon ? <span className="tape-icon">{item.icon}</span> : null}
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="tape-repeat" aria-hidden="true">
                {tapeItems.map((item, index) => (
                  <span key={`right-b-${index}`} className="tape-item">
                    {item.icon ? <span className="tape-icon">{item.icon}</span> : null}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative bg-[#121512] px-6 pb-24 pt-16">
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-[#121512] via-[#121512]/80 to-transparent" />
        <div className="ambient-orb-a pointer-events-none absolute -left-12 top-10 h-64 w-64 rounded-full bg-[#c6a15b]/10 blur-3xl" />
        <div className="ambient-orb-b pointer-events-none absolute right-6 top-24 h-64 w-64 rounded-full bg-[#7b9e8b]/12 blur-3xl" />
        <section id="projects" className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#1e251f] p-10">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Systems, networks, and interfaces.
              </h2>
              <p className="mt-4 text-white/70">
               I build and study networked systems, with an emphasis on reliability,
                clarity, and practical design.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  Networking
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  Systems
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  Interfaces
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121512] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Current focus
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li> Developing an amplifier simulation with an emphasis on spatial audio
                  and signal flow.</li>
                <li>Building a remote server manager, enabling
                  start/stop control and monitoring from external networks.</li>
                <li>Preparing for and completing networking and systems certifications.</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id="certifications"
          className="mx-auto mt-10 max-w-6xl rounded-3xl border border-white/10 bg-[#1e251f] p-10"
        >
          <h2 className="text-2xl font-semibold text-white">Certifications</h2>
          <p className="mt-4 text-white/70">
            PLACEHOLDER
          </p>
        </section>

        <section
          id="contact"
          className="mx-auto mt-10 max-w-6xl rounded-3xl border border-white/10 bg-[#1e251f] p-10"
        >
          <h2 className="text-2xl font-semibold text-white">Contact</h2>
          <p className="mt-4 text-white/70">
            kevin@acru.dev
          </p>
        </section>
      </main>
    </>
  );
}
