"use client";

import { useEffect, useRef, useState, useId } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
};

const ACCORDION_ANIMATION_DURATION = 400;

const useSequentialAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(null);
      return;
    }

    setOpenIndex(index);
  };

  return { openIndex, toggle };
};

type AccordionItemProps = {
  timeline: string;
  label: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
};

const AccordionItem = ({ timeline, label, children, isOpen, onToggle }: AccordionItemProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const contentId = useId();

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    if (isOpen) {
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !contentRef.current || typeof window === "undefined" || !("ResizeObserver" in window)) {
      return;
    }

    const element = contentRef.current;
    const observer = new ResizeObserver(() => {
      setMaxHeight(element.scrollHeight);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <div
      data-open={isOpen ? "true" : "false"}
      className="group border-b border-transparent pb-3 last:border-none last:pb-0"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
  className="summary-trigger relative flex w-full flex-wrap items-center gap-3 rounded-[18px] px-4 py-3 text-left text-xs uppercase tracking-[0.32em] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
      >
  <span className="summary-timeline text-[10px] tracking-[0.42em]">{timeline}</span>
        <span className="summary-divider" aria-hidden />
        <span className="summary-title text-current">{label}</span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-hidden={!isOpen}
        style={{ maxHeight: `${maxHeight}px`, transitionDuration: `${ACCORDION_ANIMATION_DURATION}ms` }}
        className="accordion-content overflow-hidden transition-[max-height] ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div
          ref={contentRef}
          className={`summary-content space-y-2 pt-3 pb-3 text-sm leading-7 text-[color:var(--foreground)] transition-all ease-[cubic-bezier(0.4,0,0.2,1)]`}
          style={{ 
            transitionDuration: `${ACCORDION_ANIMATION_DURATION}ms`,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-8px)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

type NowPlayingData = {
  isPlaying: boolean;
  track: {
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    url: string;
  } | null;
};

export default function Home() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [time, setTime] = useState<string>("");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      applyTheme(stored);
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = prefersDark ? "dark" : "light";
    applyTheme(initialTheme);
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setTime(formatted.replace(/\./g, ":"));
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/lastfm');
        if (response.ok) {
          const data = await response.json();
          setNowPlaying(data);
        }
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = window.setInterval(fetchNowPlaying, 5000); // Update every 5 seconds
    return () => window.clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const modeLabel = theme === "dark" ? "dark" : "light";
  const modeIcon = theme === "dark" ? "☾" : "☀︎";

  const workExperience = [
    {
      company: "BloxShield",
      timeline: "June 2025 - Present",
      role: "Software Engineering Intern",
      summary:
        "Developed internal investigation tooling using FastAPI and LangChain that automated content analysis and threat detection, resulting in a 25-30% improvement in investigation process efficiency.",
    },
    {
      company: "Uber",
      timeline: "Dec. 2024 - Sept. 2025",
      role: "Software Engineering Fellow",
      summary:
        "Selected for Uber's competitive career preparation program focused on technical interview preparation, data structures & algorithms, and software engineering best practices.",
    },
    {
      company: "Ego (YC W24)",
      timeline: "Nov. 2024 - March 2025",
      role: "Software Engineering Intern",
      summary:
        "Optimized LLM integration for enhanced user interactions, including game speech patterns and Discord activities, while improving backend efficiency through FastAPI optimizations and researching automated QA testing.",
    },
    {
      company: "SJSU College of Engineering",
      timeline: "Sept. 2024 - Present",
      role: "Software Engineering Intern",
      summary:
        "Developed a Discord bot with LLM integration using FastAPI and LangChain, enabling members to interact with club services like the fridge inventory system and access school information through natural language queries.",
    },
    {
      company: "Software and Computer Engineering Society",
      timeline: "Sept. 2024 - Sept. 2025",
      role: "AI/ML Team Lead",
      summary:
        "Led weekly workshops and team meetings focused on machine learning projects, guiding members through data analysis, model development, and collaborative coding practices using tools like Google Colab and Git.",
    },
  ];

  const hackathons = [
    {
      title: "Agent Foundry 👑",
      timeline: "August 2025",
      location: "San Francisco, California",
      summary:
        "Won 3rd place for developing OpsPilot, a zero-configuration DevOps platform that automatically discovers repositories, configures deployment pipelines, and provides live infrastructure intelligence using AWS and Terraform.",
    },
    {
      title: "NVIDIA World's Shortest Hackathon 👑",
      timeline: "July 2025",
      location: "San Francisco, California",
      summary:
        "Top 5 Finalists for developing Juri, an AI-powered legal assistant application for founders and entrepreneurs, featuring natural language legal Q&A, document processing, and automated legal document generation using NVIDIA's Nemotron model.",
    },
    {
      title: "Humane Tech Hackathon 👑",
      timeline: "June 2025",
      location: "San Francisco, California",
      summary:
        "Won First Grand Prize for developing a platform for live call transcription using VAPI webhooks with real-time audio processing, transcript management, and modern dashboard visualization.",
    },
    {
      title: "San Francisco State University: SFHacks 👑",
      timeline: "April 2025",
      location: "San Francisco, California",
      summary:
        "Won Best BioTech Hack and People of Color Empowerment awards by building agentic document workflows for first-gen immigrants struggling with medical paperwork, using video-based RAG automation to parse and fill documents.",
      links: ["Devpost", "Source"],
    },
    {
      title: "CSU Eastbay: HackHayward 2025 👑",
      timeline: "February 2025",
      location: "Hayward, California",
      summary:
        "Won Best Multimodal Use of Groq for creating an AI-powered browser agent that autonomously navigates websites via voice commands, leveraging PyGame for 3D rendering and Groq for DOM processing.",
      links: ["Devpost", "Source"],
    },
    {
      title: "Stanford XR Hacks: Immerse the Bay 2024 👑",
      timeline: "November 2024",
      location: "Stanford, California",
      summary:
        "Won Best Use of Amazon AWS, Best Integration of AI, and Runner Up for Meta with Dreamscapes, a VR sandbox enabling voice-commanded 3D model generation using FLUX.1-schelle, TripoSR, Redis vector search, and AWS S3.",
      links: ["Devpost", "Source"],
    },
  ];

  const education = {
    institution: "San Jose State University",
    degree: "Bachelor of Science in Computer Science",
    graduation: "Expected Graduation: May 2027",
  };

  const activities = [
    "Software and Computer Engineering Society",
  ];

  const { openIndex: experienceOpen, toggle: toggleExperience } = useSequentialAccordion();
  const { openIndex: hackathonOpen, toggle: toggleHackathon } = useSequentialAccordion();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16 sm:py-20">
      <div className="w-full max-w-5xl space-y-12">
        <header className="flex items-center gap-6 text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
          <span className="font-mono text-[12px] tracking-[0.32em] text-[color:var(--foreground)]">
            {time || "--:--:--"}
          </span>
          <span className="h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <a
            href="https://linkedin.com/in/n8thantran"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              LinkedIn
            </span>
          </a>
          <a
            href="https://github.com/n8thantran"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              GitHub
            </span>
          </a>
          <a
            href="/resume"
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              Resume
            </span>
          </a>
          <button
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggleTheme}
            disabled={!theme}
            aria-pressed={theme === "dark"}
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-left disabled:cursor-wait disabled:opacity-50"
          >
            <span className="text-lg leading-none text-[color:var(--foreground)] group-hover:text-[color:var(--muted)] transition-colors">
              {modeIcon}
            </span>
            <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              {modeLabel}
            </span>
          </button>
        </header>

  <main className="grid gap-12 border-b border-[color:var(--border)] pb-12 pt-6 lg:grid-cols-[minmax(240px,1fr)_minmax(360px,1.5fr)] lg:gap-16">
          <section className="flex flex-col gap-12">
            <div className="space-y-4">
              <h1 className="text-3xl font-medium tracking-tight sm:text-[40px]">Nathan Tran</h1>
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--muted)]">
                cs @ sjsu
              </p>
            </div>

            <section className="flex flex-col gap-8">
              <header className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                education
              </header>
              <article className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                  {education.graduation}
                </p>
                <h3 className="text-base font-medium uppercase tracking-[0.28em] text-[color:var(--foreground)]">
                  {education.institution}
                </h3>
                <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--muted)]">
                  {education.degree}
                </p>
              </article>
            </section>

            <section className="flex flex-col gap-6">
              <header className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                organizations & activities
              </header>
              <div className="space-y-2 text-sm leading-7 text-[color:var(--foreground)]">
                {activities.map((activity) => (
                  <p key={activity}>— {activity}</p>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <header className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                now playing
              </header>
              <div className="rounded-[22px] border border-[color:var(--border)] p-4">
                {nowPlaying?.track ? (
                  <a 
                    href={nowPlaying.track.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group"
                  >
                    {nowPlaying.track.albumArt && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img 
                          src={nowPlaying.track.albumArt} 
                          alt={`${nowPlaying.track.album} album art`}
                          className="w-full h-full rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 rounded-lg bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-[color:var(--foreground)] truncate group-hover:text-[color:var(--muted)] transition-colors">
                        {nowPlaying.track.name}
                      </p>
                      <p className="text-xs text-[color:var(--muted)] truncate">
                        {nowPlaying.track.artist}
                      </p>
                      {nowPlaying.isPlaying ? (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                            listening now
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                            last played
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 text-[color:var(--muted)]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                    <span className="text-xs">Not playing anything right now</span>
                  </div>
                )}
              </div>
            </section>
          </section>

          <section className="flex flex-col gap-12">
            <div className="flex flex-col gap-6">
              <header className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                work experience
              </header>
              <div className="space-y-3 rounded-[22px] border border-[color:var(--border)] p-6">
                {workExperience.map((item, index) => (
                  <AccordionItem
                    key={item.company}
                    timeline={item.timeline}
                    label={item.company}
                    isOpen={experienceOpen === index}
                    onToggle={() => toggleExperience(index)}
                  >
                    <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">{item.role}</p>
                    <p>{item.summary}</p>
                  </AccordionItem>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <header className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                hackathons
              </header>
              <div className="space-y-3 rounded-[22px] border border-[color:var(--border)] p-6">
                {hackathons.map((item, index) => (
                  <AccordionItem
                    key={item.title}
                    timeline={item.timeline}
                    label={item.title}
                    isOpen={hackathonOpen === index}
                    onToggle={() => toggleHackathon(index)}
                  >
                    <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">{item.location}</p>
                    <p>{item.summary}</p>
                    {item.links ? (
                      <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
                        {item.links.join(" · ")}
                      </p>
                    ) : null}
                  </AccordionItem>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="flex items-center gap-4 text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
          <span>nathan tran</span>
          <span className="h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <span>updated 2025</span>
        </footer>
      </div>
    </div>
  );
}
