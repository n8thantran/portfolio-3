"use client";

import DoomGame from "./DoomGame";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import styles from "./os.module.css";

type AppId =
  | "portfolio"
  | "about"
  | "projects"
  | "contact"
  | "media"
  | "games"
  | "doom"
  | "resume"
  | "parking"
  | "github"
  | "linkedin";
type StartupPhase = "boot" | "login" | "desktop";
type IconType =
  | "computer"
  | "document"
  | "folder"
  | "internet"
  | "media"
  | "games"
  | "doom"
  | "resume"
  | "parking"
  | "github"
  | "linkedin"
  | "trash";

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

type WindowDefinition = {
  id: AppId;
  title: string;
  icon: IconType;
  defaultOpen: boolean;
  position: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
};

type WindowCoordinates = Record<
  AppId,
  {
    top: number;
    left: number;
  }
>;

type ShortcutDefinition = {
  id: string;
  label: string;
  icon: IconType;
  appId: AppId;
};

type StartMenuItemDefinition =
  | {
      id: string;
      label: string;
      icon: IconType;
      type: "app";
      appId: AppId;
    }
  | {
      id: string;
      label: "";
      icon: IconType;
      type: "separator";
    };

type ParkingData = Record<
  string,
  {
    total: number;
    open: number | null;
  }
>;

type SocialProfileDefinition = {
  title: string;
  handle: string;
  headline: string;
  body: string;
  url: string;
  primaryLabel: string;
  secondaryApp: AppId;
  secondaryLabel: string;
  details: string[];
};

const EXPERIENCE = [
  "AfterQuery (YC W25)",
  "IOC3",
  "Uber",
  "Ego (YC W24)",
  "SJSU College of Engineering",
] as const;

const PROJECTS = [
  {
    name: "ShieldOS",
    event: "DAHacks 4.0",
    award: "Director's Choice",
    timeline: "Nov 2025",
    link: "https://devpost.com/software/shieldos-0oylw6",
  },
  {
    name: "Clean Getaway",
    event: "CalHacks 12",
    award: "Best Use of JanitorAI",
    timeline: "Oct 2025",
    link: "https://github.com/iOliver678/calhacks12",
  },
  {
    name: "OpsPilot",
    event: "Agent Foundry",
    award: "3rd Place",
    timeline: "Aug 2025",
    link: "https://github.com/n8thantran/afore-ai-agents-hackathon",
  },
  {
    name: "Juri",
    event: "NVIDIA World's Shortest Hackathon",
    award: "Top 5 Finalist",
    timeline: "Jul 2025",
    link: "https://github.com/n8thantran/nvidia-agenthack-2025",
  },
] as const;

const GARAGE_ADDRESSES: Record<string, string> = {
  "South Garage": "377 S. 7th St., San Jose, CA 95112",
  "West Garage": "350 S. 4th St., San Jose, CA 95112",
  "North Garage": "65 S. 10th St., San Jose, CA 95112",
  "South Campus Garage": "1278 S. 10th St., San Jose, CA 95112",
};

const RESUME_HIGHLIGHTS = [
  "Computer Science @ San Jose State University",
  "Building AI agents, prototypes, and product experiments",
  "Experience across AfterQuery, IOC3, Uber, and Ego",
  "Hackathon-heavy portfolio with shipped demos",
] as const;

const SOCIAL_PROFILES: Record<"github" | "linkedin", SocialProfileDefinition> = {
  github: {
    title: "GitHub Hub",
    handle: "github.com/n8thantran",
    headline: "Code, hackathon builds, and public experiments.",
    body:
      "Nathan's GitHub is where the demos, prototypes, and competition projects live. Use it like a project archive when you want raw repos instead of the curated NathanOS folders.",
    url: "https://github.com/n8thantran",
    primaryLabel: "Open GitHub",
    secondaryApp: "projects",
    secondaryLabel: "View Build Vault",
    details: [
      "Good for repo history and source links",
      "Best place to inspect hackathon code",
      "Pairs well with Build Vault for context",
    ],
  },
  linkedin: {
    title: "Career Card",
    handle: "linkedin.com/in/nthntrn",
    headline: "Experience, internships, and profile summary.",
    body:
      "Nathan's LinkedIn acts like the professional snapshot: roles, education, and the cleaner version of the story behind the projects sitting around NathanOS.",
    url: "https://linkedin.com/in/nthntrn",
    primaryLabel: "Open LinkedIn",
    secondaryApp: "resume",
    secondaryLabel: "Open Resume Viewer",
    details: [
      "Professional summary and background",
      "Useful for recruiter-friendly context",
      "Best paired with the Resume Viewer window",
    ],
  },
};

const WINDOWS: WindowDefinition[] = [
  {
    id: "portfolio",
    title: "NathanOS Home",
    icon: "computer",
    defaultOpen: false,
    position: {
      top: "2.25rem",
      left: "5rem",
      width: "40rem",
      height: "30rem",
    },
  },
  {
    id: "about",
    title: "profile.nfo - NathanPad",
    icon: "document",
    defaultOpen: false,
    position: {
      top: "4.5rem",
      left: "18rem",
      width: "34rem",
      height: "24rem",
    },
  },
  {
    id: "projects",
    title: "Build Vault",
    icon: "folder",
    defaultOpen: false,
    position: {
      top: "5rem",
      left: "44rem",
      width: "38rem",
      height: "28rem",
    },
  },
  {
    id: "contact",
    title: "NathanNet",
    icon: "internet",
    defaultOpen: false,
    position: {
      top: "4rem",
      left: "22rem",
      width: "36rem",
      height: "24rem",
    },
  },
  {
    id: "media",
    title: "NathanFM",
    icon: "media",
    defaultOpen: false,
    position: {
      top: "7rem",
      left: "54rem",
      width: "28rem",
      height: "22rem",
    },
  },
  {
    id: "games",
    title: "Games",
    icon: "games",
    defaultOpen: false,
    position: {
      top: "5rem",
      left: "20rem",
      width: "34rem",
      height: "26rem",
    },
  },
  {
    id: "doom",
    title: "DOOM.EXE",
    icon: "doom",
    defaultOpen: false,
    position: {
      top: "2.5rem",
      left: "16rem",
      width: "48rem",
      height: "36rem",
    },
  },
  {
    id: "resume",
    title: "Resume Viewer",
    icon: "resume",
    defaultOpen: false,
    position: {
      top: "3rem",
      left: "10rem",
      width: "52rem",
      height: "36rem",
    },
  },
  {
    id: "parking",
    title: "Garage Monitor",
    icon: "parking",
    defaultOpen: false,
    position: {
      top: "3.5rem",
      left: "26rem",
      width: "44rem",
      height: "31rem",
    },
  },
  {
    id: "github",
    title: "GitHub Hub",
    icon: "github",
    defaultOpen: false,
    position: {
      top: "5rem",
      left: "18rem",
      width: "36rem",
      height: "25rem",
    },
  },
  {
    id: "linkedin",
    title: "Career Card",
    icon: "linkedin",
    defaultOpen: false,
    position: {
      top: "5.5rem",
      left: "24rem",
      width: "36rem",
      height: "25rem",
    },
  },
];

const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "portfolio-shortcut",
    label: "NathanOS Home",
    icon: "computer",
    appId: "portfolio",
  },
  {
    id: "about-shortcut",
    label: "Profile Note",
    icon: "document",
    appId: "about",
  },
  {
    id: "projects-shortcut",
    label: "Build Vault",
    icon: "folder",
    appId: "projects",
  },
  {
    id: "internet-shortcut",
    label: "NathanNet",
    icon: "internet",
    appId: "contact",
  },
  {
    id: "media-shortcut",
    label: "NathanFM",
    icon: "media",
    appId: "media",
  },
  {
    id: "games-shortcut",
    label: "Games",
    icon: "games",
    appId: "games",
  },
  {
    id: "resume-shortcut",
    label: "Resume Viewer",
    icon: "resume",
    appId: "resume",
  },
  {
    id: "parking-shortcut",
    label: "Garage Monitor",
    icon: "parking",
    appId: "parking",
  },
  {
    id: "github-shortcut",
    label: "GitHub Hub",
    icon: "github",
    appId: "github",
  },
  {
    id: "linkedin-shortcut",
    label: "Career Card",
    icon: "linkedin",
    appId: "linkedin",
  },
  {
    id: "trash-shortcut",
    label: "Scrap Bin",
    icon: "trash",
    appId: "about",
  },
];

const START_MENU_ITEMS: StartMenuItemDefinition[] = [
  {
    id: "start-portfolio",
    label: "NathanOS Home",
    icon: "computer",
    type: "app",
    appId: "portfolio",
  },
  {
    id: "start-about",
    label: "Profile Note",
    icon: "document",
    type: "app",
    appId: "about",
  },
  {
    id: "start-projects",
    label: "Build Vault",
    icon: "folder",
    type: "app",
    appId: "projects",
  },
  {
    id: "start-browser",
    label: "NathanNet",
    icon: "internet",
    type: "app",
    appId: "contact",
  },
  {
    id: "start-media",
    label: "NathanFM",
    icon: "media",
    type: "app",
    appId: "media",
  },
  {
    id: "start-games",
    label: "Games",
    icon: "games",
    type: "app",
    appId: "games",
  },
  {
    id: "start-doom",
    label: "DOOM.EXE",
    icon: "doom",
    type: "app",
    appId: "doom",
  },
  {
    id: "start-separator",
    label: "",
    icon: "document",
    type: "separator",
  },
  {
    id: "start-resume",
    label: "Resume Viewer",
    icon: "resume",
    type: "app",
    appId: "resume",
  },
  {
    id: "start-parking",
    label: "Garage Monitor",
    icon: "parking",
    type: "app",
    appId: "parking",
  },
  {
    id: "start-github",
    label: "GitHub Hub",
    icon: "github",
    type: "app",
    appId: "github",
  },
  {
    id: "start-linkedin",
    label: "Career Card",
    icon: "linkedin",
    type: "app",
    appId: "linkedin",
  },
] as const;

const DEFAULT_OPEN_APPS: AppId[] = [];
const AUTO_PASSWORD = "portfolio98";

const toPixels = (value: string) => {
  if (value.endsWith("rem")) {
    return Number.parseFloat(value) * 16;
  }

  return Number.parseFloat(value);
};

const DEFAULT_WINDOW_COORDINATES = WINDOWS.reduce<WindowCoordinates>(
  (coordinates, app) => {
    coordinates[app.id] = {
      top: toPixels(app.position.top),
      left: toPixels(app.position.left),
    };
    return coordinates;
  },
  {} as WindowCoordinates,
);

const formatClock = (value: Date) =>
  value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const getGarageSummary = (garage: ParkingData[string]) => {
  const openSpots = garage.open ?? 0;
  const occupiedSpots = Math.max(0, garage.total - openSpots);
  const occupancy = garage.total > 0 ? (occupiedSpots / garage.total) * 100 : 0;

  if (garage.open === null) {
    return {
      occupancy: 0,
      openSpots: 0,
      label: "Data unavailable",
      tone: "neutral" as const,
    };
  }

  if (occupancy >= 95) {
    return { occupancy, openSpots, label: "Full or nearly full", tone: "danger" as const };
  }

  if (occupancy >= 80) {
    return { occupancy, openSpots, label: "Busy", tone: "warn" as const };
  }

  return { occupancy, openSpots, label: "Available", tone: "good" as const };
};

const NathanLogo = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    aria-hidden
    shapeRendering="crispEdges"
  >
    <rect x="1" y="1" width="14" height="14" fill="#c0c0c0" stroke="#000" />
    <rect x="3" y="3" width="10" height="10" fill="#0a246a" />
    <rect x="4" y="4" width="2" height="8" fill="#fff" />
    <rect x="6" y="5" width="1" height="2" fill="#ffcc33" />
    <rect x="7" y="7" width="1" height="2" fill="#ffcc33" />
    <rect x="8" y="8" width="1" height="2" fill="#ffcc33" />
    <rect x="10" y="4" width="2" height="8" fill="#55d5ff" />
  </svg>
);

const WinIcon = ({
  type,
  size = 40,
}: {
  type: IconType;
  size?: number;
}) => {
  switch (type) {
    case "computer":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="6" y="4" width="20" height="15" fill="#d9d9d9" stroke="#000" />
          <rect x="8" y="6" width="16" height="11" fill="#0a246a" />
          <rect x="11" y="21" width="10" height="2" fill="#6b6b6b" />
          <rect x="9" y="23" width="14" height="4" fill="#c0c0c0" stroke="#000" />
        </svg>
      );
    case "document":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <path d="M7 3h13l5 5v21H7z" fill="#fff" stroke="#000" />
          <path d="M20 3v6h5" fill="#dfe8ff" stroke="#000" />
          <rect x="10" y="13" width="12" height="1" fill="#0a246a" />
          <rect x="10" y="17" width="10" height="1" fill="#0a246a" />
          <rect x="10" y="21" width="8" height="1" fill="#0a246a" />
        </svg>
      );
    case "folder":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <path d="M3 8h10l2 3h14v14H3z" fill="#f5c74d" stroke="#000" />
          <path d="M3 11h26v4H3z" fill="#ffe08a" stroke="#000" />
        </svg>
      );
    case "internet":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <circle cx="16" cy="16" r="9" fill="#2b7de9" stroke="#000" />
          <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="#ffcc33" strokeWidth="2" />
          <path d="M7 20c4-1 10-1 18 0" fill="none" stroke="#ffcc33" strokeWidth="2" />
        </svg>
      );
    case "media":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="4" y="6" width="24" height="20" fill="#111" stroke="#000" />
          <rect x="7" y="9" width="18" height="10" fill="#1f2937" />
          <polygon points="14,12 20,16 14,20" fill="#00ff9c" />
          <rect x="8" y="22" width="16" height="2" fill="#c0c0c0" />
        </svg>
      );
    case "games":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <path d="M3 9h10l2 3h14v13H3z" fill="#f5c74d" stroke="#000" />
          <path d="M3 12h26v4H3z" fill="#ffe08a" stroke="#000" />
          <rect x="10" y="17" width="12" height="7" rx="1" fill="#5c6bc0" stroke="#000" />
          <rect x="13" y="18" width="2" height="5" fill="#fff" />
          <rect x="12" y="19" width="4" height="2" fill="#fff" />
          <circle cx="19" cy="20" r="1" fill="#fff" />
          <circle cx="21" cy="22" r="1" fill="#fff" />
        </svg>
      );
    case "doom":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="5" y="5" width="22" height="22" fill="#210000" stroke="#000" />
          <path d="M8 10l4-4 4 4 4-4 4 4v10H8z" fill="#a11b1b" />
          <rect x="11" y="15" width="3" height="3" fill="#ffdb4d" />
          <rect x="18" y="15" width="3" height="3" fill="#ffdb4d" />
          <rect x="13" y="21" width="6" height="2" fill="#fff" />
        </svg>
      );
    case "resume":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <path d="M7 3h13l5 5v21H7z" fill="#fff" stroke="#000" />
          <path d="M20 3v6h5" fill="#dfe8ff" stroke="#000" />
          <rect x="10" y="13" width="11" height="1" fill="#cc0000" />
          <rect x="10" y="17" width="9" height="1" fill="#0a246a" />
          <rect x="10" y="21" width="10" height="1" fill="#0a246a" />
        </svg>
      );
    case "parking":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="6" y="4" width="20" height="24" fill="#fff" stroke="#000" />
          <rect x="10" y="8" width="12" height="12" fill="#0a246a" />
          <path d="M14 11h4a3 3 0 010 6h-4z" fill="#fff" />
          <rect x="14" y="17" width="2" height="5" fill="#fff" />
        </svg>
      );
    case "github":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <circle cx="16" cy="16" r="11" fill="#111" stroke="#000" />
          <circle cx="12" cy="14" r="2" fill="#fff" />
          <circle cx="20" cy="14" r="2" fill="#fff" />
          <path d="M11 21c1.5-2 8.5-2 10 0" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="5" y="5" width="22" height="22" fill="#0a66c2" stroke="#000" />
          <rect x="9" y="12" width="3" height="10" fill="#fff" />
          <rect x="9" y="9" width="3" height="2" fill="#fff" />
          <path d="M15 12h3v2c1-2 6-2 6 3v5h-3v-4c0-2-3-2-3 0v4h-3z" fill="#fff" />
        </svg>
      );
    case "trash":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
          <rect x="9" y="10" width="14" height="17" fill="#d9d9d9" stroke="#000" />
          <rect x="7" y="8" width="18" height="3" fill="#c0c0c0" stroke="#000" />
          <rect x="13" y="5" width="6" height="3" fill="#c0c0c0" stroke="#000" />
        </svg>
      );
    default:
      return null;
  }
};

const StatusBar = ({ left, right }: { left: string; right: string }) => (
  <div className={styles.statusBar}>
    <div className={styles.statusPane}>{left}</div>
    <div className={styles.statusPane}>{right}</div>
  </div>
);

const DesktopEntry = ({
  shortcut,
  onOpenApp,
}: {
  shortcut: ShortcutDefinition;
  onOpenApp: (appId: AppId) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onOpenApp(shortcut.appId)}
      className={styles.desktopIcon}
    >
      <WinIcon type={shortcut.icon} />
      <span className={styles.desktopIconLabel}>{shortcut.label}</span>
    </button>
  );
};

const StartMenuItem = ({
  item,
  onOpenApp,
  onClose,
}: {
  item: StartMenuItemDefinition;
  onOpenApp: (appId: AppId) => void;
  onClose: () => void;
}) => {
  if (item.type === "separator") {
    return <div className={styles.startSeparator} />;
  }

  if (item.type === "app" && item.appId) {
    return (
      <button
        type="button"
        className={styles.startMenuItem}
        onClick={() => {
          onOpenApp(item.appId!);
          onClose();
        }}
      >
        <WinIcon type={item.icon} size={20} />
        <span>{item.label}</span>
      </button>
    );
  }

  return null;
};

const WindowShell = ({
  app,
  isVisible,
  isActive,
  isMaximized,
  position,
  zIndex,
  windowRef,
  onFocus,
  onTitleBarMouseDown,
  onMinimize,
  onMaximize,
  onClose,
  children,
}: {
  app: WindowDefinition;
  isVisible: boolean;
  isActive: boolean;
  isMaximized: boolean;
  position: WindowCoordinates[AppId];
  zIndex: number;
  windowRef: (node: HTMLDivElement | null) => void;
  onFocus: () => void;
  onTitleBarMouseDown: (event: ReactMouseEvent<HTMLElement>) => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  children: ReactNode;
}) => {
  if (!isVisible) {
    return null;
  }

  const windowStyle = isMaximized
    ? {
        top: "0.25rem",
        left: "0.25rem",
        right: "0.25rem",
        bottom: "2.5rem",
        width: "auto",
        height: "auto",
        zIndex,
      }
    : {
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: app.position.width,
        height: app.position.height,
        zIndex,
      };

  return (
    <section
      ref={windowRef}
      aria-label={app.title}
      onMouseDown={onFocus}
      className={styles.window}
      style={windowStyle}
    >
      <header
        className={`${styles.titleBar} ${
          isActive ? styles.titleBarActive : styles.titleBarInactive
        }`}
        onMouseDown={onTitleBarMouseDown}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) {
            return;
          }

          onMaximize();
        }}
      >
        <div className={styles.titleLabel}>
          <WinIcon type={app.icon} size={16} />
          <span>{app.title}</span>
        </div>
        <div className={styles.titleControls}>
          <button
            type="button"
            className={styles.captionButton}
            onClick={onMinimize}
            aria-label={`Minimize ${app.title}`}
          >
            <span className={styles.minimizeGlyph} />
          </button>
          <button
            type="button"
            className={styles.captionButton}
            onClick={onMaximize}
            aria-label={isMaximized ? `Restore ${app.title}` : `Maximize ${app.title}`}
          >
            <span className={styles.maximizeGlyph} />
          </button>
          <button
            type="button"
            className={styles.captionButton}
            onClick={onClose}
            aria-label={`Close ${app.title}`}
          >
            <span className={styles.closeGlyph}>x</span>
          </button>
        </div>
      </header>
      <div className={styles.windowInner}>{children}</div>
    </section>
  );
};

export default function OperatingSystemPage() {
  const [openApps, setOpenApps] = useState<AppId[]>(DEFAULT_OPEN_APPS);
  const [minimizedApps, setMinimizedApps] = useState<AppId[]>([]);
  const [maximizedApps, setMaximizedApps] = useState<AppId[]>([]);
  const [windowCoordinates, setWindowCoordinates] = useState<WindowCoordinates>(
    DEFAULT_WINDOW_COORDINATES,
  );
  const [zOrder, setZOrder] = useState<AppId[]>(DEFAULT_OPEN_APPS);
  const [now, setNow] = useState(() => new Date());
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [parkingLoading, setParkingLoading] = useState(true);
  const [parkingError, setParkingError] = useState<string | null>(null);
  const [parkingRefreshToken, setParkingRefreshToken] = useState(0);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [startupPhase, setStartupPhase] = useState<StartupPhase>("boot");
  const [typedPassword, setTypedPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const windowRefs = useRef<Partial<Record<AppId, HTMLDivElement | null>>>({});
  const dragStateRef = useRef<{
    appId: AppId;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const startMenuRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedParkingRef = useRef(false);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      setStartupPhase("login");
    }, 1400);

    return () => window.clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (startupPhase !== "login") {
      return;
    }

    let characterIndex = 0;
    let typingTimer: number | null = null;
    let finishTimer: number | null = null;
    setTypedPassword("");
    setIsAuthenticating(false);

    const startTimer = window.setTimeout(() => {
      typingTimer = window.setInterval(() => {
        characterIndex += 1;
        setTypedPassword(AUTO_PASSWORD.slice(0, characterIndex));

        if (characterIndex >= AUTO_PASSWORD.length && typingTimer) {
          window.clearInterval(typingTimer);
          setIsAuthenticating(true);
          finishTimer = window.setTimeout(() => {
            setStartupPhase("desktop");
          }, 900);
        }
      }, 90);
    }, 320);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) {
        window.clearInterval(typingTimer);
      }
      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }
    };
  }, [startupPhase]);

  useEffect(() => {
    const loadNowPlaying = async () => {
      try {
        const response = await fetch("/api/lastfm");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as NowPlayingData;
        setNowPlaying(payload);
      } catch (error) {
        console.error("Unable to load now playing data", error);
      }
    };

    loadNowPlaying();
    const timer = window.setInterval(loadNowPlaying, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadParkingData = async () => {
      if (!hasLoadedParkingRef.current) {
        setParkingLoading(true);
      }

      setParkingError(null);

      try {
        const response = await fetch("/api/parking", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load garage data.");
        }

        const payload = (await response.json()) as ParkingData;
        if (cancelled) {
          return;
        }

        hasLoadedParkingRef.current = true;
        setParkingData(payload);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setParkingData(null);
        setParkingError(
          error instanceof Error ? error.message : "Unable to load garage data.",
        );
      } finally {
        if (!cancelled) {
          setParkingLoading(false);
        }
      }
    };

    void loadParkingData();

    return () => {
      cancelled = true;
    };
  }, [parkingRefreshToken]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParkingRefreshToken((value) => value + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!startMenuOpen) {
        return;
      }

      const target = event.target as Node;
      if (
        startButtonRef.current?.contains(target) ||
        startMenuRef.current?.contains(target)
      ) {
        return;
      }

      setStartMenuOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [startMenuOpen]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      const workspace = workspaceRef.current;
      if (!dragState || !workspace) {
        return;
      }

      const workspaceRect = workspace.getBoundingClientRect();
      const maxLeft = Math.max(0, workspaceRect.width - dragState.width);
      const maxTop = Math.max(0, workspaceRect.height - dragState.height);
      const nextLeft = Math.min(
        Math.max(0, event.clientX - workspaceRect.left - dragState.offsetX),
        maxLeft,
      );
      const nextTop = Math.min(
        Math.max(0, event.clientY - workspaceRect.top - dragState.offsetY),
        maxTop,
      );

      setWindowCoordinates((current) => ({
        ...current,
        [dragState.appId]: {
          left: nextLeft,
          top: nextTop,
        },
      }));
    };

    const stopDragging = () => {
      if (!dragStateRef.current) {
        return;
      }

      dragStateRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  const visibleApps = useMemo(
    () => openApps.filter((appId) => !minimizedApps.includes(appId)),
    [minimizedApps, openApps],
  );

  const visibleZOrder = useMemo(
    () => zOrder.filter((appId) => visibleApps.includes(appId)),
    [visibleApps, zOrder],
  );

  const activeApp = visibleZOrder[visibleZOrder.length - 1] ?? null;
  const parkingEntries = useMemo(
    () => (parkingData ? Object.entries(parkingData) : []),
    [parkingData],
  );
  const totalGarageSpots = useMemo(
    () =>
      parkingEntries.reduce((total, [, garage]) => total + garage.total, 0),
    [parkingEntries],
  );
  const totalOpenGarageSpots = useMemo(
    () =>
      parkingEntries.reduce(
        (total, [, garage]) => total + (garage.open ?? 0),
        0,
      ),
    [parkingEntries],
  );

  const openApp = (appId: AppId) => {
    setOpenApps((current) =>
      current.includes(appId) ? current : [...current, appId],
    );
    setMinimizedApps((current) => current.filter((entry) => entry !== appId));
    setZOrder((current) => [...current.filter((entry) => entry !== appId), appId]);
    setStartMenuOpen(false);
  };

  const minimizeApp = (appId: AppId) => {
    setMinimizedApps((current) =>
      current.includes(appId) ? current : [...current, appId],
    );
    setZOrder((current) => current.filter((entry) => entry !== appId));
  };

  const closeApp = (appId: AppId) => {
    setOpenApps((current) => current.filter((entry) => entry !== appId));
    setMinimizedApps((current) => current.filter((entry) => entry !== appId));
    setMaximizedApps((current) => current.filter((entry) => entry !== appId));
    setZOrder((current) => current.filter((entry) => entry !== appId));
  };

  const toggleMaximize = (appId: AppId) => {
    setMaximizedApps((current) =>
      current.includes(appId)
        ? current.filter((entry) => entry !== appId)
        : [...current, appId],
    );
    openApp(appId);
  };

  const toggleTaskbarWindow = (appId: AppId) => {
    const isVisible = visibleApps.includes(appId);
    const isFrontmost = activeApp === appId;

    if (isVisible && isFrontmost) {
      minimizeApp(appId);
      return;
    }

    openApp(appId);
  };

  const refreshParking = () => {
    setParkingLoading(true);
    setParkingRefreshToken((value) => value + 1);
  };

  const openGarageMap = (garageName: string) => {
    const address = GARAGE_ADDRESSES[garageName];
    if (!address) {
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${encodeURIComponent(address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const aboutText = `Nathan Tran

Computer Science @ San Jose State University
Expected graduation: May 2027

Currently building across AI agents, hackathon prototypes,
and fast product experiments.

Recent stops:
- AfterQuery (YC W25)
- IOC3
- Uber
- Ego (YC W24)
- SJSU College of Engineering

What I optimize for:
- shipping quickly
- strong demos
- thoughtful tooling
- collaborative teams`;

  const beginWindowDrag =
    (appId: AppId) => (event: ReactMouseEvent<HTMLElement>) => {
      if (window.innerWidth < 1024 || maximizedApps.includes(appId)) {
        return;
      }

      if ((event.target as HTMLElement).closest("button")) {
        return;
      }

      const workspace = workspaceRef.current;
      const windowElement = windowRefs.current[appId];
      if (!workspace || !windowElement) {
        return;
      }

      const windowRect = windowElement.getBoundingClientRect();
      dragStateRef.current = {
        appId,
        offsetX: event.clientX - windowRect.left,
        offsetY: event.clientY - windowRect.top,
        width: windowRect.width,
        height: windowRect.height,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "move";
      openApp(appId);
      event.preventDefault();
    };

  return (
    <main
      className={styles.desktop}
      style={{
        fontFamily:
          "Tahoma, 'MS Sans Serif', Arial, var(--font-geist-sans), sans-serif",
      }}
    >
      <div ref={workspaceRef} className={styles.workspace}>
        <div className={styles.iconField}>
          {SHORTCUTS.map((shortcut) => (
            <DesktopEntry
              key={shortcut.id}
              shortcut={shortcut}
              onOpenApp={openApp}
            />
          ))}
        </div>

        {WINDOWS.map((app) => (
          <WindowShell
            key={app.id}
            app={app}
            isVisible={visibleApps.includes(app.id)}
            isActive={activeApp === app.id}
            isMaximized={maximizedApps.includes(app.id)}
            position={windowCoordinates[app.id]}
            zIndex={zOrder.indexOf(app.id) + 10}
            windowRef={(node: HTMLDivElement | null) => {
              windowRefs.current[app.id] = node;
            }}
            onFocus={() => openApp(app.id)}
            onTitleBarMouseDown={beginWindowDrag(app.id)}
            onMinimize={() => minimizeApp(app.id)}
            onMaximize={() => toggleMaximize(app.id)}
            onClose={() => closeApp(app.id)}
          >
            {app.id === "portfolio" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Go</span>
                  <span>Favorites</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.toolbarButton}>
                    Back
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Forward
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Up
                  </button>
                  <div className={styles.addressRow}>
                    <span className={styles.toolbarLabel}>Address</span>
                    <div className={styles.addressField}>C:\NathanOS\Home</div>
                  </div>
                </div>
                <div className={styles.explorerLayout}>
                  <div className={`${styles.insetPanel} ${styles.sidebarPanel}`}>
                    <p className={styles.sidebarTitle}>System</p>
                    <ul className={styles.sidebarList}>
                      <li>User: Nathan Tran</li>
                      <li>OS: NathanOS Classic</li>
                      <li>Location: San Jose, CA</li>
                      <li>Focus: AI tools and fast demos</li>
                    </ul>
                    <p className={styles.sidebarTitle}>Current Thread</p>
                    <ul className={styles.sidebarList}>
                      {EXPERIENCE.slice(0, 3).map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${styles.insetPanel} ${styles.explorerMain}`}>
                    <div className={styles.explorerGrid}>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("about")}
                      >
                        <WinIcon type="document" />
                        <span>Profile Note</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("projects")}
                      >
                        <WinIcon type="folder" />
                        <span>Build Vault</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("contact")}
                      >
                        <WinIcon type="internet" />
                        <span>NathanNet</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("media")}
                      >
                        <WinIcon type="media" />
                        <span>NathanFM</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("games")}
                      >
                        <WinIcon type="games" />
                        <span>Games</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("resume")}
                      >
                        <WinIcon type="resume" />
                        <span>Resume Viewer</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("parking")}
                      >
                        <WinIcon type="parking" />
                        <span>Garage Monitor</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("github")}
                      >
                        <WinIcon type="github" />
                        <span>GitHub Hub</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("linkedin")}
                      >
                        <WinIcon type="linkedin" />
                        <span>Career Card</span>
                      </button>
                      <button
                        type="button"
                        className={styles.explorerItem}
                        onClick={() => openApp("doom")}
                      >
                        <WinIcon type="doom" />
                        <span>DOOM.EXE</span>
                      </button>
                    </div>
                  </div>
                </div>
                <StatusBar left="10 object(s)" right="NathanOS Home" />
              </>
            )}

            {app.id === "about" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>Search</span>
                  <span>Help</span>
                </div>
                <div className={`${styles.insetPanel} ${styles.notepadSurface}`}>
                  {aboutText}
                </div>
                <StatusBar left="Ready" right="Ln 1, Col 1" />
              </>
            )}

            {app.id === "projects" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.toolbarButton}>
                    Open
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Copy
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Details
                  </button>
                  <div className={styles.addressRow}>
                    <span className={styles.toolbarLabel}>Address</span>
                    <div className={styles.addressField}>C:\NathanOS\BuildVault</div>
                  </div>
                </div>
                <div className={`${styles.insetPanel} ${styles.listView}`}>
                  <div className={styles.listHeader}>
                    <span>Name</span>
                    <span>Award</span>
                    <span>Date</span>
                  </div>
                  {PROJECTS.map((project) => (
                    <div key={project.name} className={styles.listRow}>
                      <div>
                        <strong>{project.name}</strong>
                        <p className={styles.rowMeta}>{project.event}</p>
                      </div>
                      <span>{project.award}</span>
                      <span>{project.timeline}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.linkStrip}>
                  {PROJECTS.map((project) => (
                    <a
                      key={project.name}
                      href={project.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={styles.toolbarButton}
                    >
                      {project.name} link
                    </a>
                  ))}
                </div>
                <StatusBar left={`${PROJECTS.length} item(s)`} right="Build Vault" />
              </>
            )}

            {app.id === "contact" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Favorites</span>
                  <span>Tools</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.toolbarButton}>
                    Back
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Stop
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Refresh
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Home
                  </button>
                </div>
                <div className={styles.addressRowStandalone}>
                  <span className={styles.toolbarLabel}>Address</span>
                  <div className={styles.addressField}>nathanos://network/home</div>
                </div>
                <div className={`${styles.insetPanel} ${styles.browserPage}`}>
                  <h2 className={styles.browserHeading}>Nathan Tran</h2>
                  <p className={styles.browserParagraph}>
                    Computer science student building AI-assisted software and
                    hackathon-heavy product experiments.
                  </p>
                  <div className={styles.browserButtons}>
                    <button
                      type="button"
                      className={styles.browserButton}
                      onClick={() => openApp("github")}
                    >
                      GitHub Hub
                    </button>
                    <button
                      type="button"
                      className={styles.browserButton}
                      onClick={() => openApp("linkedin")}
                    >
                      Career Card
                    </button>
                    <button
                      type="button"
                      className={styles.browserButton}
                      onClick={() => openApp("resume")}
                    >
                      Resume Viewer
                    </button>
                    <button
                      type="button"
                      className={styles.browserButton}
                      onClick={() => openApp("parking")}
                    >
                      Garage Monitor
                    </button>
                  </div>
                </div>
                <StatusBar left="NathanNet" right="Done" />
              </>
            )}

            {app.id === "media" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>View</span>
                  <span>Play</span>
                  <span>Favorites</span>
                  <span>Help</span>
                </div>
                <div className={styles.mediaLayout}>
                  <div className={styles.mediaScreen}>
                    <p>NathanFM</p>
                    <p>{nowPlaying?.track?.name ?? "No track loaded"}</p>
                    <p>{nowPlaying?.track?.artist ?? "Waiting for Last.fm activity..."}</p>
                  </div>
                  <div className={styles.mediaControls}>
                    {nowPlaying?.track?.albumArt ? (
                      <img
                        src={nowPlaying.track.albumArt}
                        alt={`${nowPlaying.track.album} album art`}
                        className={styles.albumArt}
                      />
                    ) : (
                      <div className={styles.albumArtPlaceholder} />
                    )}
                    <div className={styles.mediaMeta}>
                      <p>{nowPlaying?.track?.album ?? "No album selected"}</p>
                      <p>{nowPlaying?.isPlaying ? "Playing" : "Stopped"}</p>
                      <div className={styles.mediaButtons}>
                        <button type="button" className={styles.toolbarButton}>
                          |&lt;
                        </button>
                        <button type="button" className={styles.toolbarButton}>
                          &gt;
                        </button>
                        <button type="button" className={styles.toolbarButton}>
                          []
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <StatusBar
                  left={nowPlaying?.isPlaying ? "Playing" : "Stopped"}
                  right={formatClock(now)}
                />
              </>
            )}

            {app.id === "resume" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <a
                    href="/api/resume"
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.toolbarButton}
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => openApp("projects")}
                  >
                    Projects
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => openApp("linkedin")}
                  >
                    Career Card
                  </button>
                  <div className={styles.addressRow}>
                    <span className={styles.toolbarLabel}>Address</span>
                    <div className={styles.addressField}>C:\NathanOS\Docs\Resume.pdf</div>
                  </div>
                </div>
                <div className={styles.documentLayout}>
                  <div className={`${styles.insetPanel} ${styles.documentSurface}`}>
                    <iframe
                      src="/api/resume"
                      title="Nathan Tran Resume"
                      className={styles.documentFrame}
                    />
                  </div>
                  <div className={`${styles.insetPanel} ${styles.documentSidebar}`}>
                    <h3 className={styles.documentSidebarTitle}>Quick Summary</h3>
                    <p className={styles.documentSidebarText}>
                      Resume access stays inside NathanOS now. Use the viewer for a full read,
                      then jump into projects or the career card for more detail.
                    </p>
                    <ul className={styles.sidebarList}>
                      {RESUME_HIGHLIGHTS.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <StatusBar left="1 document" right="Resume Viewer" />
              </>
            )}

            {app.id === "parking" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>View</span>
                  <span>Refresh</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={refreshParking}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => openApp("contact")}
                  >
                    NathanNet
                  </button>
                  <div className={styles.addressRow}>
                    <span className={styles.toolbarLabel}>Address</span>
                    <div className={styles.addressField}>C:\NathanOS\Utilities\GarageMonitor</div>
                  </div>
                </div>
                <div className={styles.parkingLayout}>
                  <div className={styles.summaryStrip}>
                    <div className={`${styles.insetPanel} ${styles.summaryChip}`}>
                      Open now: {parkingEntries.length > 0 ? totalOpenGarageSpots : "--"}
                    </div>
                    <div className={`${styles.insetPanel} ${styles.summaryChip}`}>
                      Total capacity: {parkingEntries.length > 0 ? totalGarageSpots : "--"}
                    </div>
                    <div className={`${styles.insetPanel} ${styles.summaryChip}`}>
                      Last update: {formatClock(now)}
                    </div>
                  </div>
                  {parkingLoading ? (
                    <div className={`${styles.insetPanel} ${styles.emptyPanel}`}>
                      Loading garage telemetry...
                    </div>
                  ) : parkingError ? (
                    <div className={`${styles.insetPanel} ${styles.emptyPanel}`}>
                      Garage monitor is offline right now. Try Refresh in a moment.
                    </div>
                  ) : (
                    <div className={styles.parkingGrid}>
                      {parkingEntries.map(([garageName, garage]) => {
                        const summary = getGarageSummary(garage);
                        const meterClassName =
                          summary.tone === "danger"
                            ? `${styles.parkingMeterFill} ${styles.parkingMeterDanger}`
                            : summary.tone === "warn"
                              ? `${styles.parkingMeterFill} ${styles.parkingMeterWarn}`
                              : styles.parkingMeterFill;

                        return (
                          <div
                            key={garageName}
                            className={`${styles.insetPanel} ${styles.parkingCard}`}
                          >
                            <div className={styles.parkingCardHeader}>
                              <div>
                                <h3 className={styles.parkingCardTitle}>{garageName}</h3>
                                <p className={styles.parkingCardMeta}>
                                  {GARAGE_ADDRESSES[garageName] ?? "San Jose, CA"}
                                </p>
                              </div>
                              <span className={styles.parkingStatus}>{summary.label}</span>
                            </div>
                            <div className={styles.parkingNumbers}>
                              <span>Open: {summary.openSpots}</span>
                              <span>Total: {garage.total}</span>
                            </div>
                            <div className={styles.parkingMeter}>
                              <div
                                className={meterClassName}
                                style={{ width: `${Math.min(summary.occupancy, 100)}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.browserButton}
                              onClick={() => openGarageMap(garageName)}
                            >
                              Open Map
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <StatusBar left={`${parkingEntries.length || 4} garage(s)`} right="Garage Monitor" />
              </>
            )}

            {(app.id === "github" || app.id === "linkedin") &&
              (() => {
                const socialProfile =
                  app.id === "github" ? SOCIAL_PROFILES.github : SOCIAL_PROFILES.linkedin;

                return (
                  <>
                    <div className={styles.menuBar}>
                      <span>File</span>
                      <span>Edit</span>
                      <span>View</span>
                      <span>Help</span>
                    </div>
                    <div className={styles.profileLayout}>
                      <div className={`${styles.insetPanel} ${styles.profileCard}`}>
                        <div className={styles.profileHeader}>
                          <div className={styles.profileBadge}>
                            <WinIcon type={app.icon} size={56} />
                          </div>
                          <div>
                            <h2 className={styles.browserHeading}>{socialProfile.title}</h2>
                            <p className={styles.profileHeadline}>{socialProfile.handle}</p>
                          </div>
                        </div>
                        <p className={styles.profileCopy}>{socialProfile.body}</p>
                        <div className={styles.profileActions}>
                          <a
                            href={socialProfile.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.browserButton}
                          >
                            {socialProfile.primaryLabel}
                          </a>
                          <button
                            type="button"
                            className={styles.browserButton}
                            onClick={() => openApp(socialProfile.secondaryApp)}
                          >
                            {socialProfile.secondaryLabel}
                          </button>
                        </div>
                      </div>
                      <div className={`${styles.insetPanel} ${styles.profileDetails}`}>
                        <h3 className={styles.documentSidebarTitle}>Profile Notes</h3>
                        <p className={styles.documentSidebarText}>
                          {socialProfile.headline}
                        </p>
                        <ul className={styles.profileList}>
                          {socialProfile.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <StatusBar left="Profile ready" right={socialProfile.title} />
                  </>
                );
              })()}

            {app.id === "games" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Help</span>
                </div>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.toolbarButton}>
                    Open
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Play
                  </button>
                  <button type="button" className={styles.toolbarButton}>
                    Refresh
                  </button>
                  <div className={styles.addressRow}>
                    <span className={styles.toolbarLabel}>Address</span>
                    <div className={styles.addressField}>C:\NathanOS\Games</div>
                  </div>
                </div>
                <div className={styles.gamesLibrary}>
                  <button
                    type="button"
                    className={styles.gameCard}
                    onClick={() => openApp("doom")}
                  >
                    <div className={styles.gameCardArt}>
                      <WinIcon type="doom" size={56} />
                    </div>
                    <div className={styles.gameCardBody}>
                      <div>
                        <h3 className={styles.gameCardTitle}>DOOM.EXE</h3>
                        <p className={styles.gameCardText}>
                          A tiny browser-built corridor shooter hidden inside NathanOS.
                        </p>
                      </div>
                      <div className={styles.gameCardMeta}>
                        <span className={styles.gameBadge}>WASD</span>
                        <span className={styles.gameBadge}>Space</span>
                        <span className={styles.gameBadge}>Retro FPS</span>
                      </div>
                    </div>
                  </button>
                  <div className={styles.gameShelfNote}>
                    More experiments can live here later. For now, there is one good reason to click Play.
                  </div>
                </div>
                <StatusBar left="1 item(s)" right="Games" />
              </>
            )}

            {app.id === "doom" && (
              <>
                <div className={styles.menuBar}>
                  <span>File</span>
                  <span>View</span>
                  <span>Action</span>
                  <span>Help</span>
                </div>
                <DoomGame active={activeApp === "doom"} />
              </>
            )}
          </WindowShell>
        ))}
      </div>

      {startMenuOpen && (
        <div ref={startMenuRef} className={styles.startMenu}>
          <div className={styles.startMenuRail}>
            <span>NathanOS</span>
          </div>
          <div className={styles.startMenuContent}>
            {START_MENU_ITEMS.map((item) => (
              <StartMenuItem
                key={item.id}
                item={item}
                onOpenApp={openApp}
                onClose={() => setStartMenuOpen(false)}
              />
            ))}
          </div>
        </div>
      )}

      <footer className={styles.taskbar}>
        <button
          ref={startButtonRef}
          type="button"
          className={`${styles.startButton} ${
            startMenuOpen ? styles.buttonPressed : ""
          }`}
          onClick={() => setStartMenuOpen((current) => !current)}
        >
          <NathanLogo />
          <span>Nathan</span>
        </button>

        <div className={styles.taskButtons}>
          {WINDOWS.map((app) => {
            if (!openApps.includes(app.id)) {
              return null;
            }

            const isPressed = activeApp === app.id && !minimizedApps.includes(app.id);

            return (
              <button
                key={app.id}
                type="button"
                className={`${styles.taskButton} ${
                  isPressed ? styles.buttonPressed : ""
                }`}
                onClick={() => toggleTaskbarWindow(app.id)}
              >
                <WinIcon type={app.icon} size={16} />
                <span>{app.title}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.tray}>
          <span className={styles.trayDot} aria-hidden />
          <span>{formatClock(now)}</span>
        </div>
      </footer>

      {startupPhase !== "desktop" && (
        <div className={styles.startupOverlay}>
          {startupPhase === "boot" ? (
            <div className={styles.bootScreen}>
              <div className={styles.bootCard}>
                <NathanLogo size={56} />
                <div>
                  <p className={styles.bootEyebrow}>NathanOS Classic</p>
                  <h1 className={styles.bootHeading}>Starting NathanOS...</h1>
                </div>
                <div className={styles.bootProgressFrame}>
                  <div className={styles.bootProgressFill} />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.loginScreen}>
              <div className={styles.loginDialog}>
                <div className={styles.loginTitleBar}>
                  <span>Enter NathanOS Password</span>
                </div>
                <div className={styles.loginBody}>
                  <div className={styles.loginCopy}>
                    <NathanLogo size={44} />
                    <div>
                      <p>Type a password to log on to NathanOS.</p>
                      <p className={styles.loginSubtle}>
                        Logging on as Nathan Tran
                      </p>
                    </div>
                  </div>

                  <div className={styles.loginFields}>
                    <label className={styles.loginLabel}>
                      <span>User name:</span>
                      <div className={styles.loginInput}>Nathan Tran</div>
                    </label>
                    <label className={styles.loginLabel}>
                      <span>Password:</span>
                      <div className={styles.loginInput}>
                        {"*".repeat(typedPassword.length)}
                      </div>
                    </label>
                  </div>

                  <div className={styles.loginActions}>
                    <button
                      type="button"
                      className={`${styles.startButton} ${
                        isAuthenticating ? styles.buttonPressed : ""
                      }`}
                    >
                      OK
                    </button>
                    <button type="button" className={styles.startButton}>
                      Cancel
                    </button>
                  </div>

                  <p className={styles.loginStatus}>
                    {isAuthenticating
                      ? "Loading your personal settings..."
                      : "Authenticating..."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
