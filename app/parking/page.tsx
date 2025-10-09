"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Theme = "light" | "dark";
const STORAGE_KEY = "theme";

type ParkingData = {
  [key: string]: {
    total: number;
    open: number | null;
  };
};

const GARAGE_ADDRESSES: { [key: string]: string } = {
  "South Garage": "377 S. 7th St., San Jose, CA 95112",
  "West Garage": "350 S. 4th St., San Jose, CA 95112",
  "North Garage": "65 S. 10th St., San Jose, CA 95112",
  "South Campus Garage": "1278 S. 10th Street, San Jose, CA 95112",
};

const ParkingCard = ({
  name,
  open,
  total,
}: {
  name: string;
  open: number | null;
  total: number;
}) => {
  const openSpots = open !== null ? open : 0;
  const occupiedSpots = total - openSpots;
  const occupancyPercentage = total > 0 ? (occupiedSpots / total) * 100 : 0;
  const address = GARAGE_ADDRESSES[name];

  const getBarColor = () => {
    if (occupancyPercentage >= 100) return "bg-red-600";
    if (occupancyPercentage > 80) return "bg-red-500";
    if (occupancyPercentage > 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getOccupancyStatus = () => {
    if (occupancyPercentage >= 100) return "Full";
    if (occupancyPercentage > 90) return "Nearly Full";
    if (occupancyPercentage > 80) return "Very Full";
    if (occupancyPercentage > 60) return "Moderately Full";
    if (occupancyPercentage > 30) return "Available";
    return "Plenty of Space";
  };

  const handleOpenMaps = () => {
    if (!address) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${encodeURIComponent(address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="rounded-[22px] border border-[color:var(--border)] p-6 w-full flex flex-col transition-all hover:border-[color:var(--muted)]">
      <div className="flex-grow">
        <h3 className="text-lg uppercase tracking-[0.32em] text-[color:var(--foreground)] mb-4">
          {name}
        </h3>
        {open !== null ? (
          <>
            <div className="my-4">
              <p className="text-4xl font-light text-[color:var(--foreground)]">
                {Math.round(occupancyPercentage)}%
                <span className="text-sm uppercase tracking-[0.42em] text-[color:var(--muted)] ml-2">
                  occupied
                </span>
              </p>
              <p className="text-xs uppercase tracking-[0.42em] text-[color:var(--muted)] mt-2">
                {openSpots} of {total} spots • {getOccupancyStatus()}
              </p>
            </div>
            <div className="w-full bg-[color:var(--border)] rounded-full h-2 my-4">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <div className="my-4">
              <p className="text-xl text-[color:var(--muted)]">
                Data not available
              </p>
              <p className="text-xs uppercase tracking-[0.42em] text-[color:var(--muted)] mt-2">
                Unable to retrieve current occupancy data
              </p>
            </div>
            <div className="w-full bg-[color:var(--border)] rounded-full h-2 my-4">
              <div className="h-2 rounded-full bg-[color:var(--muted)] animate-pulse"></div>
            </div>
          </>
        )}
      </div>

      {address && (
        <div className="mt-auto pt-4 text-left">
          <p className="text-xs uppercase tracking-[0.42em] text-[color:var(--muted)] mb-3">
            {address}
          </p>
          <button
            onClick={handleOpenMaps}
            className="w-full text-center px-4 py-3 rounded-[18px] border border-[color:var(--border)] text-xs uppercase tracking-[0.32em] text-[color:var(--muted)] hover:bg-[color:var(--border)]/20 transition-colors"
          >
            Open in Maps
          </button>
        </div>
      )}
    </div>
  );
};

export default function ParkingPage() {
  const [data, setData] = useState<ParkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = prefersDark ? "dark" : "light";
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
    async function fetchData() {
      try {
        const res = await fetch("/api/parking");
        const jsonData = await res.json();
        setData(jsonData);
      } catch (error) {
        console.error("Failed to fetch parking data", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const modeIcon = theme === "dark" ? "☾" : "☀︎";

  return (
    <div
      data-theme={theme || "dark"}
      className="flex min-h-screen flex-col bg-[color:var(--background)] font-[family-name:var(--font-geist-sans)] text-[color:var(--foreground)] antialiased transition-colors"
    >
      <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col gap-12 p-6 sm:p-8 md:gap-16 md:p-12">
        <header className="flex items-center gap-4 text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
          <Link 
            href="/"
            className="hover:text-[color:var(--foreground)] transition-colors cursor-pointer"
          >
            ← Home
          </Link>
          <span className="h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <span className="tabular-nums">{time}</span>
          <button
            type="button"
            onClick={() => {
              const nextTheme: Theme = theme === "dark" ? "light" : "dark";
              document.documentElement.dataset.theme = nextTheme;
              document.documentElement.style.colorScheme = nextTheme;
              window.localStorage.setItem(STORAGE_KEY, nextTheme);
              setTheme(nextTheme);
            }}
            className="flex h-6 w-6 items-center justify-center text-base transition-opacity hover:opacity-70"
            aria-label="Toggle theme"
          >
            {modeIcon}
          </button>
        </header>

        <main className="flex flex-1 flex-col gap-12">
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] font-light leading-[1.2] tracking-tight text-[color:var(--foreground)]">
                SJSU Parking Status
              </h1>
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                Real-time occupancy levels and availability for campus parking garages.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[22px] border border-[color:var(--border)] p-6 animate-pulse"
                  >
                    <div className="h-6 bg-[color:var(--border)] rounded w-3/4 mb-4"></div>
                    <div className="h-10 bg-[color:var(--border)] rounded w-1/2 mb-4"></div>
                    <div className="h-2 bg-[color:var(--border)] rounded-full w-full"></div>
                  </div>
                ))}
              </div>
            ) : data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(data).map(([name, details]) => (
                  <ParkingCard
                    key={name}
                    name={name}
                    open={details.open}
                    total={details.total}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[color:var(--border)] p-6 text-center">
                <p className="text-sm text-[color:var(--muted)]">
                  Could not load parking data. Please try again later.
                </p>
              </div>
            )}
          </section>
        </main>

        <footer className="flex items-center gap-4 text-[11px] uppercase tracking-[0.42em] text-[color:var(--muted)]">
          <span>SJSU Parking</span>
          <span className="h-px flex-1 bg-[color:var(--border)]" aria-hidden />
          <span>updated 2025</span>
        </footer>
      </div>
    </div>
  );
}
