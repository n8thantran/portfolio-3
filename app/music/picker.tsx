"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Deliberately not imported from lib/lastfm: that module is server only, and
// pulling it in here would drag the api key and every fetch helper into the
// client bundle for the sake of one line of string formatting.
const keyOf = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const yearOf = (key: string) => Number(key.slice(0, 4));

/**
 * The month label doubles as the control: two native selects painted to look
 * like the line of text they sit in. Native keeps the whole picker on one line
 * instead of a grid, and on a phone it opens the platform's own wheel.
 */
export function MonthPicker({
  year,
  month,
  first,
  last,
}: {
  year: number;
  month: number;
  /** Oldest month with anything in it, "YYYY-MM". */
  first: string;
  /** The current month, "YYYY-MM". */
  last: string;
}) {
  const router = useRouter();

  const exists = (y: number, m: number) => {
    const key = keyOf(y, m);
    return key >= first && key <= last;
  };

  // Landing on a month that does not exist would 404, so the edges of the
  // archive clamp instead: pick jan of the first year and you get its first
  // real month.
  const go = (y: number, m: number) => {
    const key = exists(y, m)
      ? keyOf(y, m)
      : keyOf(y, m) < first
        ? first
        : last;

    if (key !== keyOf(year, month)) router.push(`/music/${key}`);
  };

  const years = [];
  for (let y = yearOf(first); y <= yearOf(last); y++) years.push(y);

  return (
    <span className="inline-flex items-center gap-1">
      <Select
        label="Month"
        value={month}
        onChange={(value) => go(year, value)}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1} disabled={!exists(year, i + 1)}>
            {name}
          </option>
        ))}
      </Select>

      <Select label="Year" value={year} onChange={(value) => go(value, month)}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </span>
  );
}

/** A native select wearing the surrounding text's clothes. */
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="-mx-1 cursor-pointer appearance-none rounded-[3px] bg-transparent py-0.5 pr-4 pl-1 font-mono text-[11px] text-foreground transition-colors duration-200 hover:bg-foreground/[0.07] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        {children}
      </select>

      <span
        aria-hidden
        className="pointer-events-none absolute right-0 text-[7px] text-muted"
      >
        ▼
      </span>
    </span>
  );
}
