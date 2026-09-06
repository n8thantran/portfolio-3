import Link from "next/link";
import { monthKey } from "../lib/lastfm";

const WEEKDAYS = ["s", "m", "t", "w", "t", "f", "s"];
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

// Five steps, keyed off the month's own busiest day rather than a fixed number,
// so a quiet month still reads as a shape instead of an empty grid. Everything
// is `foreground` at varying strength, which means it inverts with the theme for
// free and never needs a colour of its own.
const HEAT = [
  "bg-foreground/[0.05]",
  "bg-foreground/20",
  "bg-foreground/35",
  "bg-foreground/55",
  "bg-foreground/80",
];

function level(plays: number, busiest: number) {
  if (plays <= 0) return 0;
  if (busiest <= 0) return 1;
  const share = plays / busiest;
  if (share > 0.75) return 4;
  if (share > 0.5) return 3;
  if (share > 0.25) return 2;
  return 1;
}

/** A month grid where each day is shaded by how much was played on it. */
export function Calendar({
  year,
  label,
  days,
  startsOn,
  today,
}: {
  year: number;
  /** "september 2026"; the month name for the day tooltips is taken from it. */
  label: string;
  days: number[];
  startsOn: number;
  today: number | null;
}) {
  const busiest = Math.max(0, ...days);
  const monthName = label.split(" ")[0];

  return (
    <div className="w-full max-w-[19rem]">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <span
            key={i}
            aria-hidden
            className="pb-1 text-center font-mono text-[9px] tracking-[0.12em] text-muted/70 uppercase"
          >
            {day}
          </span>
        ))}

        {/* the 1st rarely lands on a Sunday, so the row is padded up to it */}
        {Array.from({ length: startsOn }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}

        {days.map((plays, i) => {
          const day = i + 1;
          const heat = level(plays, busiest);
          const isToday = today === day;

          return (
            <span
              key={day}
              title={`${monthName} ${day}, ${year} · ${plays.toLocaleString()} ${
                plays === 1 ? "scrobble" : "scrobbles"
              }`}
              className={[
                "flex aspect-square items-center justify-center rounded-[3px]",
                "font-mono text-[9px] tabular-nums transition-colors duration-200",
                HEAT[heat],
                heat >= 3 ? "text-background" : "text-muted",
                isToday ? "ring-1 ring-foreground/70 ring-offset-0" : "",
              ].join(" ")}
            >
              {day}
            </span>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 font-mono text-[9px] text-muted/70">
        <span>less</span>
        {HEAT.map((tone, i) => (
          <span key={i} className={`size-2.5 rounded-[2px] ${tone}`} />
        ))}
        <span>more</span>
        {busiest > 0 ? (
          <span className="ml-auto">busiest day · {busiest.toLocaleString()}</span>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Year on one line, months on the next. Anything outside the range that actually
 * has scrobbles in it is rendered as plain text rather than a link, so the
 * archive never offers a door that opens onto an empty room.
 */
export function MonthPicker({
  year,
  month,
  first,
  last,
}: {
  year: number;
  month: number;
  first: string;
  last: string;
}) {
  const inRange = (key: string) => key >= first && key <= last;

  const yearLink = (delta: number) => {
    // stepping a year keeps the month where possible, and otherwise lands on the
    // nearest month of that year that exists
    const target = year + delta;
    const candidate = monthKey(target, month);
    if (inRange(candidate)) return candidate;

    const firstOfYear = `${target}-01`;
    const lastOfYear = `${target}-12`;
    if (lastOfYear < first || firstOfYear > last) return null;
    return candidate < first ? first : last;
  };

  const back = yearLink(-1);
  const forward = yearLink(1);

  return (
    <nav className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3 font-mono text-[11px]">
        <Arrow to={back} label="Previous year">
          ‹
        </Arrow>
        <span className="tabular-nums text-foreground">{year}</span>
        <Arrow to={forward} label="Next year">
          ›
        </Arrow>
      </div>

      <ol className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[11px]">
        {MONTHS.map((name, i) => {
          const key = monthKey(year, i + 1);
          const current = i + 1 === month;

          if (current) {
            return (
              <li key={key} aria-current="page" className="text-foreground">
                {name}
              </li>
            );
          }

          return (
            <li key={key}>
              {inRange(key) ? (
                <Link
                  href={`/music/${key}`}
                  className="text-muted underline decoration-transparent underline-offset-[5px] transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
                >
                  {name}
                </Link>
              ) : (
                <span className="text-muted/30">{name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Arrow({
  to,
  label,
  children,
}: {
  to: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!to) {
    return (
      <span aria-hidden className="text-muted/25">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={`/music/${to}`}
      aria-label={label}
      className="text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
    >
      {children}
    </Link>
  );
}
