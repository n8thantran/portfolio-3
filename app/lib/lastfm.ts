// Server side Last.fm reads, imported only by server components. The key and
// the username live in env and never reach the browser, and every function here
// returns a hand built shape so no part of the upstream payload (profile urls,
// images, usernames) can leak.

const API = "https://ws.audioscrobbler.com/2.0/";

// Last.fm's own `period` values are rolling windows: "1month" means the last
// thirty days, not this month. So the charts here are fetched by explicit date
// range instead, which is what the weekly chart methods actually accept despite
// the name.
//
// The month has to be measured in one fixed zone rather than the visitor's, or
// the same scrobbles would fall in different months depending on who is looking.
// These are Nathan's plays, so it is Nathan's calendar that decides.
const LISTENING_TZ = "America/Los_Angeles";

// The live month is re-read on this cadence, and any range end that would
// otherwise be "now" is snapped to it, so every visitor inside a window asks for
// the same url and the cache can actually hold.
const WINDOW_S = 1800;

// A month that has already ended cannot gain plays, and its request urls are
// fixed rather than snapped to now, so its cache entry stays valid far longer.
// Not forever, only because scrobbles can still be edited or deleted after the
// fact. This is what keeps browsing the archive cheap: each old month pays its
// paging cost once a day at most, however many times it is opened.
const ARCHIVE_S = 86_400;

// Paging guard for the day by day counts. Forty pages is eight thousand plays in
// one month, which is far past anything real.
const MAX_PAGES = 40;

// A busy month is around twenty pages. Firing all of them at once is rude to an
// api with no published burst allowance, so they go out in batches instead. This
// costs a few hundred milliseconds on a cold render and nothing on a warm one.
const PAGE_BATCH = 8;

export type Entry = {
  name: string;
  detail?: string;
  plays: number;
  url: string;
};

export type ListeningMonth = {
  /** "2026-09". */
  key: string;
  /** "september 2026". */
  label: string;
  year: number;
  /** 1 to 12. */
  month: number;
  scrobbles: number;
  /** Total listening time in seconds, or null when no durations were available. */
  seconds: number | null;
  /** Share of the month's plays whose track length was actually known, 0 to 1. */
  known: number;
  /** Scrobbles per day. Index 0 is the 1st. */
  days: number[];
  /** Weekday the 1st falls on, 0 is Sunday. */
  startsOn: number;
  /** Day of the month that is today, or null when this is not the current month. */
  today: number | null;
  artists: Entry[];
  tracks: Entry[];
  albums: Entry[];
};

/** "41h 42m". Minutes are dropped once the number is only decorative. */
export function formatSpan(seconds: number): string {
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function spotifySearch(...parts: string[]): string {
  return `https://open.spotify.com/search/${encodeURIComponent(parts.join(" "))}`;
}

// ---------------------------------------------------------------- calendar --

// What a zone's clock reads at some instant, as plain numbers.
function partsIn(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const out: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return out as Record<
    "year" | "month" | "day" | "hour" | "minute" | "second",
    number
  >;
}

// That same clock reading treated as if it were UTC, minus the real instant,
// is the zone's offset at that moment.
function offsetMs(at: Date, timeZone: string) {
  const p = partsIn(at, timeZone);
  const asIfUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUTC - Math.floor(at.getTime() / 1000) * 1000;
}

// Midnight at the start of a given day, in the listening zone, as unix seconds.
function midnight(year: number, month: number, day: number) {
  const wall = Date.UTC(year, month - 1, day, 0, 0, 0);

  // The first pass uses the offset in force now; the second uses the one
  // actually in force at the candidate instant. That second pass is what keeps
  // this correct across a daylight saving change.
  const first = wall - offsetMs(new Date(wall), LISTENING_TZ);
  const second = wall - offsetMs(new Date(first), LISTENING_TZ);
  return Math.floor(second / 1000);
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function currentMonthKey(now = new Date()) {
  const p = partsIn(now, LISTENING_TZ);
  return monthKey(p.year, p.month);
}

/** Parses "2026-09". Returns null for anything else, including nonsense months. */
export function parseMonthKey(key: string | undefined) {
  const m = /^(\d{4})-(\d{2})$/.exec(key ?? "");
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2999) return null;
  return { year, month };
}

// A plain calendar date's weekday and length do not depend on the zone, so these
// can be answered with UTC arithmetic and no offset work at all.
const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
const weekdayOfFirst = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .toLowerCase();
}

// ------------------------------------------------------------------ fetch --

async function call(
  method: string,
  extra: Record<string, string> = {},
  revalidate = WINDOW_S,
) {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USERNAME;
  if (!key || !user) return null;

  const params = new URLSearchParams({
    method,
    user,
    api_key: key,
    format: "json",
    ...extra,
  });

  try {
    const res = await fetch(`${API}?${params}`, {
      headers: { "User-Agent": "nathan-site" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type Raw = {
  name?: string;
  playcount?: string | number;
  // the chart endpoints nest the artist name under "#text" where the top
  // endpoints use "name", so both spellings have to be understood here
  artist?: { name?: string; "#text"?: string } | string;
};

function artistOf(artist: Raw["artist"]) {
  if (typeof artist === "string") return artist.trim();
  return (artist?.name ?? artist?.["#text"])?.trim();
}

function shape(items: Raw[] | undefined, withArtist: boolean): Entry[] {
  if (!Array.isArray(items)) return [];

  return items
    .flatMap((item) => {
      const name = item.name?.trim();
      if (!name) return [];

      const artist = artistOf(item.artist);

      return [
        {
          name,
          detail: withArtist ? artist : undefined,
          plays: Number(item.playcount ?? 0),
          url: spotifySearch(name, withArtist && artist ? artist : ""),
        },
      ];
    })
    .sort((a, b) => b.plays - a.plays);
}

// Track length lives on user.getTopTracks and nowhere on the chart endpoints, so
// listening time needs a second source. The rolling "1month" window is the wrong
// thing to count plays with, which is the whole point of this file, but it is an
// excellent LOOKUP TABLE for the current month: it is the widest duration set
// Last.fm will hand over in one call, and being a rolling thirty days it almost
// entirely contains whatever part of this month has happened so far.
//
// Only the durations are taken from it. Every playcount still comes from the
// calendar month chart. Do not be tempted to read plays out of this.
//
// For an older month the overlap is gone, so `overall` is used instead: a worse
// hit rate, but the fallback average covers the miss and nothing else is on offer.
async function trackSeconds(
  isCurrent: boolean,
  ttl: number,
): Promise<Map<string, number>> {
  const data = await call(
    "user.getTopTracks",
    { period: isCurrent ? "1month" : "overall", limit: "1000" },
    ttl,
  );

  const out = new Map<string, number>();
  const items: Raw[] = Array.isArray(data?.toptracks?.track)
    ? data.toptracks.track
    : [];

  for (const item of items) {
    const name = item.name?.trim();
    const seconds = Number((item as { duration?: string }).duration ?? 0);
    // a lot of entries carry duration "0", meaning nobody has tagged a length
    if (!name || !Number.isFinite(seconds) || seconds <= 0) continue;
    out.set(trackKey(artistOf(item.artist), name), seconds);
  }

  return out;
}

function trackKey(artist: string | undefined, name: string) {
  return `${artist ?? ""} ${name}`.toLowerCase();
}

// Exact where the length is known; the rest of the plays are charged the average
// length of the plays that were known, which beats dropping them silently.
function listeningTime(tracks: Entry[], lengths: Map<string, number>) {
  let knownPlays = 0;
  let knownSeconds = 0;
  let totalPlays = 0;

  for (const track of tracks) {
    totalPlays += track.plays;
    const seconds = lengths.get(trackKey(track.detail, track.name));
    if (seconds) {
      knownPlays += track.plays;
      knownSeconds += seconds * track.plays;
    }
  }

  if (knownPlays === 0 || totalPlays === 0) return { seconds: null, known: 0 };

  const average = knownSeconds / knownPlays;
  return {
    seconds: Math.round(knownSeconds + average * (totalPlays - knownPlays)),
    known: knownPlays / totalPlays,
  };
}

type RecentTrack = {
  date?: { uts?: string };
  "@attr"?: { nowplaying?: string };
};

// Per day counts, from the raw scrobble log rather than a chart, because a chart
// has no timestamps in it. Page one is fetched first only to learn how many
// pages there are; the rest go out together.
async function playsByDay(
  from: number,
  to: number,
  length: number,
  ttl: number,
) {
  const counts = new Array<number>(length).fill(0);

  const tally = (data: unknown) => {
    const items = (data as { recenttracks?: { track?: RecentTrack[] } })
      ?.recenttracks?.track;
    if (!Array.isArray(items)) return;

    for (const item of items) {
      // the currently playing track is included with no date and is not a scrobble
      if (item["@attr"]?.nowplaying) continue;
      const uts = Number(item.date?.uts);
      if (!Number.isFinite(uts) || uts <= 0) continue;

      const day = partsIn(new Date(uts * 1000), LISTENING_TZ).day;
      if (day >= 1 && day <= length) counts[day - 1]++;
    }
  };

  const range = { from: String(from), to: String(to), limit: "200" };
  const first = await call("user.getRecentTracks", { ...range, page: "1" }, ttl);
  if (!first) return counts;
  tally(first);

  const pages = Math.min(
    Number(first?.recenttracks?.["@attr"]?.totalPages ?? 1) || 1,
    MAX_PAGES,
  );

  for (let page = 2; page <= pages; page += PAGE_BATCH) {
    const batch = Array.from(
      { length: Math.min(PAGE_BATCH, pages - page + 1) },
      (_, i) =>
        call("user.getRecentTracks", { ...range, page: String(page + i) }, ttl),
    );
    (await Promise.all(batch)).forEach(tally);
  }

  return counts;
}

/**
 * The first month with anything in it, so the archive navigation knows where to
 * stop going backwards. Registration date is a slight overshoot of the first
 * scrobble, which is the safe direction to be wrong in.
 */
export async function firstMonthKey(): Promise<string | null> {
  // a registration date is the one thing here that genuinely never changes
  const data = await call("user.getInfo", {}, ARCHIVE_S);
  const unix = Number(data?.user?.registered?.unixtime);
  if (!Number.isFinite(unix) || unix <= 0) return null;

  const p = partsIn(new Date(unix * 1000), LISTENING_TZ);
  return monthKey(p.year, p.month);
}

/**
 * Everything the music page shows, for one calendar month.
 *
 * The charts are separate upstream methods but one date range, and the month's
 * scrobble total is the artist chart summed before it is trimmed, since every
 * scrobble has exactly one artist.
 */
export async function listeningMonth(
  key?: string,
  counts = { artists: 8, tracks: 5, albums: 5 },
): Promise<ListeningMonth> {
  const now = new Date();
  const today = partsIn(now, LISTENING_TZ);
  const { year, month } = parseMonthKey(key) ?? {
    year: today.year,
    month: today.month,
  };

  const isCurrent = year === today.year && month === today.month;
  const length = daysInMonth(year, month);

  const from = midnight(year, month, 1);
  const until = midnight(month === 12 ? year + 1 : year, (month % 12) + 1, 1);
  // a finished month ends where it ends; a live one ends at the cache boundary
  // so the request url holds still for everyone inside the window
  const snapped = Math.floor(now.getTime() / 1000 / WINDOW_S) * WINDOW_S;
  const to = Math.max(from, Math.min(until - 1, snapped));

  const range = { from: String(from), to: String(to) };
  const ttl = isCurrent ? WINDOW_S : ARCHIVE_S;

  const [artistData, trackData, albumData, lengths, days] = await Promise.all([
    call("user.getWeeklyArtistChart", range, ttl),
    call("user.getWeeklyTrackChart", range, ttl),
    call("user.getWeeklyAlbumChart", range, ttl),
    trackSeconds(isCurrent, ttl),
    playsByDay(from, to, length, ttl),
  ]);

  const artists = shape(artistData?.weeklyartistchart?.artist, false);
  const tracks = shape(trackData?.weeklytrackchart?.track, true);
  const albums = shape(albumData?.weeklyalbumchart?.album, true);
  const { seconds, known } = listeningTime(tracks, lengths);

  return {
    key: monthKey(year, month),
    label: monthLabel(year, month),
    year,
    month,
    scrobbles: artists.reduce((total, entry) => total + entry.plays, 0),
    seconds,
    known,
    days,
    startsOn: weekdayOfFirst(year, month),
    today: isCurrent ? today.day : null,
    artists: artists.slice(0, counts.artists),
    tracks: tracks.slice(0, counts.tracks),
    albums: albums.slice(0, counts.albums),
  };
}
