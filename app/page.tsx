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
  label: string | ReactNode;
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
      className="group border-b border-transparent pb-2 sm:pb-3 last:border-none last:pb-0"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
  className="summary-trigger relative flex w-full flex-wrap items-center gap-2 sm:gap-3 rounded-[14px] sm:rounded-[18px] px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs uppercase tracking-[0.24em] sm:tracking-[0.32em] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
      >
  <span className="summary-timeline text-[9px] sm:text-[10px] tracking-[0.32em] sm:tracking-[0.42em] whitespace-nowrap">{timeline}</span>
        <span className="summary-divider" aria-hidden />
        <span className="summary-title text-current text-[10px] sm:text-xs">{label}</span>
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
          className={`summary-content space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 pb-2 sm:pb-3 text-xs sm:text-sm leading-6 sm:leading-7 text-[color:var(--foreground)] transition-all ease-[cubic-bezier(0.4,0,0.2,1)]`}
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

type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

type GitHubData = {
  contributions: ContributionDay[];
  totalContributions: number;
};

export default function Home() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [time, setTime] = useState<string>("");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [github, setGithub] = useState<GitHubData | null>(null);

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
    const interval = window.setInterval(fetchNowPlaying, 1000); // Update every 5 seconds
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchGithub = async () => {
      try {
        const response = await fetch('/api/github');
        if (response.ok) {
          const data = await response.json();
          setGithub(data);
        }
      } catch (error) {
        console.error('Failed to fetch GitHub contributions:', error);
      }
    };

    fetchGithub();
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
      company: "AfterQuery (YC W25)",
      link: "https://afterquery.com/",
      timeline: "Jan. 2026 - Present",
      role: "Software Engineering Intern",
      summary:
        "Contributed to innovative AI research alongside a world-class team at a Y Combinator-backed lab, advancing the boundaries of artificial intelligence through creative experimentation and strong collaboration.",
    },
    {
      company: "BloxShield",
      link: "https://bloxshield.org/",
      timeline: "June 2025 - Present",
      role: "Software Engineering Intern",
      summary:
        "Developed internal investigation tooling using FastAPI and LangChain that automated content analysis and threat detection, resulting in a 25-30% improvement in investigation process efficiency.",
    },
    {
      company: "Uber",
      link: "https://uber.com",
      timeline: "Dec. 2024 - Present",
      role: "Software Engineering Fellow",
      summary:
        "Selected for Uber's competitive career preparation program focused on technical interview preparation, data structures & algorithms, and software engineering best practices.",
    },
    {
      company: "Ego (YC W24)",
      link: "https://ego.live",
      timeline: "Nov. 2024 - March 2025",
      role: "Software Engineering Intern",
      summary:
        "Optimized LLM integration for enhanced user interactions, including game speech patterns and Discord activities, while improving backend efficiency through FastAPI optimizations and researching automated QA testing.",
    },
    {
      company: "SJSU College of Engineering",
      link: "https://sce.sjsu.edu/",
      timeline: "Sept. 2024 - Present",
      role: "Software Engineering Intern",
      summary:
        "Developed a Discord bot with LLM integration using FastAPI and LangChain, enabling members to interact with club services like the fridge inventory system and access school information through natural language queries.",
    },
    {
      company: "Software and Computer Engineering Society",
      link: "https://sce.sjsu.edu/",
      timeline: "Sept. 2024 - Present",
      role: "Artificial Intelligence & Machine Learning Team Lead",
      summary:
        "Led weekly workshops and team meetings focused on machine learning projects, guiding members through data analysis, model development, and collaborative coding practices using tools like Google Colab and Git.",
    },
  ];

  const hackathons = [
    {
      title: "DAHacks 4.0 👑",
      timeline: "November 2025",
      location: "Cupertino, California",
      summary: "Won Director's Choice for ShieldOS, an autonomous security platform featuring real-time attack detection (DDoS, SQL injection) using Scapy packet sniffing, LLM-powered threat analysis with Groq, and automated vulnerability remediation via GitHub PR generation.",
      links: [
        { label: "Devpost", url: "https://devpost.com/software/shieldos-0oylw6" },
        { label: "Source", url: "https://github.com/n8thantran/dahacks25" },
      ],
    },
    {
      title: "CalHacks 12 👑",
      timeline: "October 2025",
      location: "San Francisco, California",
      summary: "Won Best Use of JanitorAI for developing Clean Getaway a game where you have to escape a city by Social Engineering AI Agent powered NPCs.",
      links: [
        { label: "Source", url: "https://github.com/iOliver678/calhacks12" },
        { label: "Game Trailer", url: "https://youtu.be/JKwvzp-RNJs?si=hhEuhqRpXaoe54GK" },
      ]
    },
    {
      title: "Agent Foundry 👑",
      timeline: "August 2025",
      location: "San Francisco, California",
      summary:
        "Won 3rd place for developing OpsPilot, a zero-configuration DevOps platform that automatically discovers repositories, configures deployment pipelines, and provides live infrastructure intelligence using AWS and Terraform.",
      links: [
        { label: "Source", url: "https://github.com/n8thantran/afore-ai-agents-hackathon" },
      ],
    },
    {
      title: "NVIDIA World's Shortest Hackathon 👑",
      timeline: "July 2025",
      location: "San Francisco, California",
      summary:
        "Top 5 Finalists for developing Juri, an AI-powered legal assistant application for founders and entrepreneurs, featuring natural language legal Q&A, document processing, and automated legal document generation using NVIDIA's Nemotron model.",
      links: [
        { label: "Source", url: "https://github.com/n8thantran/nvidia-agenthack-2025" },
      ],
    },
    {
      title: "Humane Tech Hackathon 👑",
      timeline: "June 2025",
      location: "San Francisco, California",
      summary:
        "Won First Grand Prize for developing a platform for live call transcription using VAPI webhooks with real-time audio processing, transcript management, and modern dashboard visualization.",
      links: [
        { label: "Source", url: "https://github.com/n8thantran/humane-tech-hackathon" },
      ],
    },
    {
      title: "San Francisco State University: SFHacks 👑",
      timeline: "April 2025",
      location: "San Francisco, California",
      summary:
        "Won Best BioTech Hack and People of Color Empowerment awards by developing an Agentic document workflows for first-gen immigrants struggling with medical documents. A user uploads a video explaining their situation to power a RAG automation agent to parse and fill documents.",
      links: [
        { label: "Devpost", url: "https://devpost.com/software/form-force" },
        { label: "Source", url: "https://github.com/jask1m/fillosophy" },
      ],
    },
    {
      title: "CSU Eastbay: HackHayward 2025 👑",
      timeline: "February 2025",
      location: "Hayward, California",
      summary:
        "Won Best Multimodal Use of Groq for developing an AI-powered Browser Agent that autonomously navigates websites and completes tasks via voice commands, utilizing PyGame for rendering the Browser Assistant 3D Model and Groq for processing the website's DOM.",
      links: [
        { label: "Devpost", url: "https://devpost.com/software/ava-zamdu0" },
        { label: "Source", url: "https://github.com/n8thantran/HackHayward2025" },
      ],
    },
    {
      title: "Stanford XR Hacks: Immerse the Bay 2024 👑",
      timeline: "November 2024",
      location: "Stanford, California",
      summary:
        "Won Best Use of Amazon AWS, Best Integration of AI prizes, and Runner Up for Meta for Dreamscapes, a VR sandbox enabling voice-commanded 3D model generation. Created an AI pipeline using FLUX.1-schelle and TripoSR models to convert text to 3D meshes in ~30 seconds, while implementing Redis vector search for asset caching and AWS S3 for model storage and delivery.",
      links: [
        { label: "Devpost", url: "https://devpost.com/software/stellar-horizons" },
        { label: "Source", url: "https://github.com/banyar-shin/DreamScapes" },
      ],
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <div className="w-full max-w-5xl space-y-8 sm:space-y-12">
        <header className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
          <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.28em] sm:tracking-[0.32em] text-[color:var(--foreground)]">
            {time || "--:--:--"}
          </span>
          <span className="hidden sm:block h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <a
            href="https://linkedin.com/in/nthntrn"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[color:var(--border)] px-2.5 py-1.5 sm:px-3 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              LinkedIn
            </span>
          </a>
          <a
            href="https://github.com/n8thantran"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[color:var(--border)] px-2.5 py-1.5 sm:px-3 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              GitHub
            </span>
          </a>
          <a
            href="/resume"
            className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[color:var(--border)] px-2.5 py-1.5 sm:px-3 text-left hover:bg-[color:var(--border)] transition-colors"
          >
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              Resume
            </span>
          </a>
          <button
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggleTheme}
            disabled={!theme}
            aria-pressed={theme === "dark"}
            className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[color:var(--border)] px-2.5 py-1.5 sm:px-3 text-left disabled:cursor-wait disabled:opacity-50"
          >
            <span className="text-base sm:text-lg leading-none text-[color:var(--foreground)] group-hover:text-[color:var(--muted)] transition-colors">
              {modeIcon}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors">
              {modeLabel}
            </span>
          </button>
        </header>

  <main className="grid gap-8 sm:gap-12 border-b border-[color:var(--border)] pb-8 sm:pb-12 pt-4 sm:pt-6 lg:grid-cols-[minmax(240px,1fr)_minmax(360px,1.5fr)] lg:gap-16">
          <section className="flex flex-col gap-8 sm:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-[40px] font-medium tracking-tight">Nathan Tran</h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.32em] text-[color:var(--muted)]">
                cs @ sjsu
              </p>
            </div>

            <section className="flex flex-col gap-6 sm:gap-8">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                education
              </header>
              <article className="space-y-2 sm:space-y-3">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                  {education.graduation}
                </p>
                <h3 className="text-sm sm:text-base font-medium uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[color:var(--foreground)]">
                  {education.institution}
                </h3>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.32em] text-[color:var(--muted)]">
                  {education.degree}
                </p>
              </article>
            </section>

            <section className="flex flex-col gap-4 sm:gap-6">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                organizations & activities
              </header>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm leading-6 sm:leading-7 text-[color:var(--foreground)]">
                {activities.map((activity) => (
                  <p key={activity}>— {activity}</p>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4 sm:gap-6">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                now playing
              </header>
              <div className="rounded-[18px] sm:rounded-[22px] border border-[color:var(--border)] p-3 sm:p-4">
                {nowPlaying?.track ? (
                  <a
                    href={nowPlaying.track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 sm:gap-4 group"
                  >
                    {nowPlaying.track.albumArt && (
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                        <img
                          src={nowPlaying.track.albumArt}
                          alt={`${nowPlaying.track.album} album art`}
                          className="w-full h-full rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 rounded-lg bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-[color:var(--foreground)] truncate group-hover:text-[color:var(--muted)] transition-colors">
                        {nowPlaying.track.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-[color:var(--muted)] truncate">
                        {nowPlaying.track.artist}
                      </p>
                      {nowPlaying.isPlaying ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                          </span>
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                            listening now
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                            last played
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 text-[color:var(--muted)]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                    <span className="text-[11px] sm:text-xs">Not playing anything right now</span>
                  </div>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-4 sm:gap-6">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                github
              </header>
              <a
                href="https://github.com/n8thantran"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[18px] sm:rounded-[22px] border border-[color:var(--border)] p-3 sm:p-4 hover:bg-[color:var(--border)]/10 transition-colors"
              >
                {github && github.contributions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <div
                        className="grid gap-[2px] sm:gap-[3px]"
                        style={{
                          gridTemplateRows: 'repeat(7, 1fr)',
                          gridAutoFlow: 'column',
                          gridAutoColumns: 'minmax(8px, 1fr)',
                        }}
                      >
                        {github.contributions.map((day, index) => (
                          <div
                            key={day.date || index}
                            className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] transition-colors"
                            style={{
                              backgroundColor:
                                day.level === 0
                                  ? 'var(--border)'
                                  : day.level === 1
                                    ? theme === 'dark' ? '#0e4429' : '#9be9a8'
                                    : day.level === 2
                                      ? theme === 'dark' ? '#006d32' : '#40c463'
                                      : day.level === 3
                                        ? theme === 'dark' ? '#26a641' : '#30a14e'
                                        : theme === 'dark' ? '#39d353' : '#216e39',
                            }}
                            title={`${day.count} contributions on ${day.date}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                        {github.totalContributions.toLocaleString()} contributions in {new Date().getFullYear()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] sm:text-[9px] text-[color:var(--muted)]">Less</span>
                        {[0, 1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px]"
                            style={{
                              backgroundColor:
                                level === 0
                                  ? 'var(--border)'
                                  : level === 1
                                    ? theme === 'dark' ? '#0e4429' : '#9be9a8'
                                    : level === 2
                                      ? theme === 'dark' ? '#006d32' : '#40c463'
                                      : level === 3
                                        ? theme === 'dark' ? '#26a641' : '#30a14e'
                                        : theme === 'dark' ? '#39d353' : '#216e39',
                            }}
                          />
                        ))}
                        <span className="text-[8px] sm:text-[9px] text-[color:var(--muted)]">More</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 text-[color:var(--muted)]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    <span className="text-[11px] sm:text-xs">Loading contributions...</span>
                  </div>
                )}
              </a>
            </section>
          </section>

          <section className="flex flex-col gap-8 sm:gap-12">
            <div className="flex flex-col gap-4 sm:gap-6">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                work experience
              </header>
              <div className="space-y-3 rounded-[18px] sm:rounded-[22px] border border-[color:var(--border)] p-4 sm:p-6">
                {workExperience.map((item, index) => (
                  <AccordionItem
                    key={item.company}
                    timeline={item.timeline}
                    label={
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-[color:var(--accent)] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.company}
                      </a>
                    }
                    isOpen={experienceOpen === index}
                    onToggle={() => toggleExperience(index)}
                  >
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.32em] text-[color:var(--muted)]">{item.role}</p>
                    <p>{item.summary}</p>
                  </AccordionItem>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
              <header className="text-[9px] sm:text-[10px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
                hackathons
              </header>
              <div className="space-y-3 rounded-[18px] sm:rounded-[22px] border border-[color:var(--border)] p-4 sm:p-6">
                {hackathons.map((item, index) => (
                  <AccordionItem
                    key={item.title}
                    timeline={item.timeline}
                    label={item.title}
                    isOpen={hackathonOpen === index}
                    onToggle={() => toggleHackathon(index)}
                  >
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">{item.location}</p>
                    <p>{item.summary}</p>
                    {item.links && item.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3">
                        {item.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.32em] text-[color:var(--muted)] hover:text-[color:var(--accent)] transition-colors underline decoration-dotted underline-offset-4"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </AccordionItem>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.42em] text-[color:var(--muted)]">
          <span className="whitespace-nowrap">nathan tran</span>
          <span className="h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <a
            href="/parking"
            className="flex items-center transition-opacity hover:opacity-70"
            aria-label="SJSU Parking Status"
            title="SJSU Parking Status"
          >
            🚗
          </a>
          <span className="whitespace-nowrap">updated 2025</span>
        </footer>
      </div>
    </div>
  );
}
