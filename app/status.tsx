"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NowPlaying as Track } from "./api/now-playing/route";

const POLL_MS = 5000;
const SCROLL_PX_PER_SEC = 26;

export function Clock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZoneName: "short",
        }).format(new Date()),
      );

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // null on the server and the first paint, so the clock never hydrates mismatched
  return (
    <span
      className="shrink-0 whitespace-nowrap tabular-nums"
      suppressHydrationWarning
    >
      {now ?? " "}
    </span>
  );
}

export function NowPlaying() {
  const [track, setTrack] = useState<Track | null>(null);
  const [overflows, setOverflows] = useState(false);
  const [duration, setDuration] = useState(0);

  const viewport = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (document.hidden) return; // a backgrounded tab does not need to poll
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Track;
        if (alive) setTrack(data);
      } catch {
        // offline or the route is down, just leave the line as it was
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);

    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  const label = track?.title
    ? `${track.isPlaying ? "" : "last played · "}${track.title} · ${track.artist}`
    : "";

  // only scroll when the line genuinely does not fit, so short titles sit still
  useLayoutEffect(() => {
    const view = viewport.current;
    const text = measure.current;
    if (!view || !text) return;

    const check = () => {
      const room = view.clientWidth;
      const width = text.getBoundingClientRect().width;
      const over = width > room + 1;
      setOverflows(over);
      setDuration(over ? (width + room) / SCROLL_PX_PER_SEC : 0);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(view);
    return () => observer.disconnect();
  }, [label]);

  if (!track?.configured || !track.title) return null;

  const content = (
    <>
      {track.isPlaying ? (
        <span
          aria-hidden
          className="mr-2 inline-block size-[5px] translate-y-[-1px] rounded-full bg-current align-middle"
        />
      ) : null}
      {label}
    </>
  );

  const inner = overflows ? (
    // two identical copies, translated by exactly half, so the loop is seamless
    <span
      className="marquee"
      style={{ animationDuration: `${duration}s` }}
    >
      <span className="pr-10 whitespace-nowrap">{content}</span>
      <span aria-hidden className="pr-10 whitespace-nowrap">
        {content}
      </span>
    </span>
  ) : (
    <span className="block w-full truncate whitespace-nowrap sm:text-right">
      {content}
    </span>
  );

  return (
    <span
      ref={viewport}
      className={`block min-w-0 flex-1 overflow-hidden ${overflows ? "marquee-mask" : ""}`}
    >
      {/* twin used purely to measure the natural width. the clipper is zero
          sized with hidden overflow so it cannot widen the page, while the
          nowrap inline-block inside still reports its full content width. */}
      <span
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      >
        <span ref={measure} className="inline-block whitespace-nowrap">
          {content}
        </span>
      </span>

      {track.url ? (
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block underline decoration-transparent underline-offset-[5px] transition-[text-decoration-color] duration-200 hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </span>
  );
}
