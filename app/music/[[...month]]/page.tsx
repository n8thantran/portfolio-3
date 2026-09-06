import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  currentMonthKey,
  firstMonthKey,
  formatSpan,
  listeningMonth,
  parseMonthKey,
  type Entry,
} from "../../lib/lastfm";
import { Backdrop } from "../../backdrop";
import { ThemeToggle } from "../../theme";
import { NowPlaying } from "../../status";
import { MonthPicker } from "../picker";

// The live month is prerendered and then refreshed in the background on this
// cadence, so nobody ever waits on Last.fm to see the page: the first visitor in
// a window gets the previous render instantly and the new one lands behind them.
// Archive months are not prerendered (there are five years of them) but they are
// cached the same way once somebody opens one.
export const revalidate = 1800;

export function generateStaticParams() {
  return [{ month: [] as string[] }];
}

const link =
  "underline decoration-transparent decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-200 hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current";

// `/music` is the current month; `/music/2026-08` is that one. Anything else in
// the path is not a month and should 404 rather than quietly showing today.
function readMonth(segments: string[] | undefined) {
  if (!segments || segments.length === 0) return { key: undefined, ok: true };
  if (segments.length > 1) return { key: undefined, ok: false };

  const key = segments[0];
  return { key, ok: parseMonthKey(key) !== null };
}

export async function generateMetadata({
  params,
}: PageProps<"/music/[[...month]]">): Promise<Metadata> {
  const { month } = await params;
  const { key, ok } = readMonth(month);
  if (!ok) return { title: "Music · Nathan Tran" };

  const parsed = parseMonthKey(key);
  const when = parsed
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)))
    : "this month";

  return {
    title: "Music · Nathan Tran",
    description: `What I had on in ${when}.`,
  };
}

// Some plays are charged an average length rather than a real one, so the
// number wears a ~ and says so on hover rather than pretending to be exact.
function coverageNote(known: number) {
  return known >= 0.999
    ? "Summed from track lengths."
    : `Track lengths are known for ${Math.round(known * 100)}% of this month's plays. The rest are charged the average.`;
}

function Chart({ title, entries }: { title: string; entries: Entry[] }) {
  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-[10.5px] tracking-[0.18em] text-muted uppercase">
        {title}
      </h2>

      <ol className="mt-4 flex flex-col gap-2">
        {entries.map((entry, i) => (
          <li
            key={`${entry.name}-${i}`}
            className="flex flex-nowrap items-baseline justify-between gap-6"
          >
            <span className="min-w-0 truncate text-[14px]">
              <span className="mr-3 font-mono text-[10.5px] text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {entry.name}
              </a>
              {entry.detail ? (
                <span className="text-muted"> · {entry.detail}</span>
              ) : null}
            </span>

            <span className="shrink-0 font-mono text-[10.5px] text-muted tabular-nums">
              {entry.plays.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function Music({ params }: PageProps<"/music/[[...month]]">) {
  const { month: segments } = await params;
  const { key, ok } = readMonth(segments);
  if (!ok) notFound();

  const now = currentMonthKey();
  // a month that has not happened yet has nothing to show and no reason to exist
  if (key && key > now) notFound();

  const [month, first] = await Promise.all([listeningMonth(key), firstMonthKey()]);

  const { scrobbles, seconds, known, artists, tracks, albums } = month;
  const empty = artists.length === 0;

  return (
    <>
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-[38rem] flex-col px-6 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-nowrap items-baseline justify-between gap-6">
          <h1 className="text-[17px] font-medium tracking-[-0.015em]">Music</h1>
          <ThemeToggle />
        </header>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] text-muted">
          <MonthPicker
            year={month.year}
            month={month.month}
            first={first ?? "2000-01"}
            last={now}
          />
          {scrobbles ? (
            <span>· {scrobbles.toLocaleString()} scrobbles</span>
          ) : null}
          {seconds ? (
            <span title={coverageNote(known)} className="cursor-help">
              · {known >= 0.999 ? "" : "~"}
              {formatSpan(seconds)}
            </span>
          ) : null}
        </div>

        <div className="mt-12 flex flex-1 flex-col gap-10">
          {empty ? (
            <p className="text-[14px] text-muted">Nothing scrobbled this month.</p>
          ) : (
            <>
              <Chart title="Artists" entries={artists} />
              <Chart title="Tracks" entries={tracks} />
              <Chart title="Albums" entries={albums} />
            </>
          )}
        </div>

        <footer className="relative mt-12 flex flex-nowrap items-baseline justify-between gap-6 pt-12 font-mono text-[10.5px] whitespace-nowrap text-muted">
          <Link
            href="/"
            className="shrink-0 underline decoration-muted/45 underline-offset-4 transition-colors duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            back
          </Link>
          <NowPlaying />
        </footer>
      </main>
    </>
  );
}
