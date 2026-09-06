# nathan-site

Ultra minimal portfolio. Next.js 16 (App Router) + Tailwind v4. One screen, no scroll.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## Layout

- `app/experience.ts` — the only file to edit for content. One object per role.
- `app/page.tsx` — every row shares one shape: content flush left, meta flush right.
- `app/globals.css` — the whole palette is three tokens (background, foreground, muted)
  in an off black / off white pair. The only animation left in the site is the now
  playing marquee, and it only runs when the title does not fit.
- `app/backdrop.tsx` — one static frame of domain warped noise, drawn once at full
  device resolution and redrawn only on a resize or a theme change. No loop, no
  ongoing GPU cost. The canvas carries the flat palette colour in CSS, so the first
  paint is correct before any JavaScript runs.
- `app/theme.tsx` — light/dark toggle. Writes `data-theme` on `<html>` and persists to
  `localStorage`. The icon is styled purely from that attribute, so it is correct on the
  first paint. `app/layout.tsx` inlines a tiny head script that applies a saved theme
  before paint, so there is no flash.
- `app/status.tsx` — footer clock (the visitor's own local time) and now playing.

## Pages

- `/` — the one screen portfolio. The footer is the visitor's local clock and a ♪
  linking to the music page.
- `/music` and `/music/2026-08` — one calendar month, current or archived. A
  heatmap calendar of the month's scrobbles, a year and month picker, then top
  artists, tracks and albums, plus the live now playing line. Server rendered
  from Last.fm. The month is measured in a fixed zone (`LISTENING_TZ`), not the
  visitor's, so the same scrobbles never land in two different months.

  One optional catch-all route serves both. A month that is not a real month, is
  in the future, or has extra path segments after it, 404s.

  Listening time is approximate, and says so with a `~` and a hover note. Track
  length is not on the chart endpoints at all, so it is looked up from
  `user.getTopTracks`; plays whose length is unknown are charged the average of
  the ones that are known.

  The per-day counts come from paging the raw scrobble log, which is the only
  place timestamps exist. That is the expensive part of the page, so a finished
  month (whose plays cannot change, and whose request urls are fixed rather than
  snapped to now) caches for a day, while the live month caches for half an hour.

Only `/` carries `data-fit-screen`, which is what the CSS scroll lock keys off. The
music page is taller than a screen, so it simply omits the attribute and scrolls.

## Now playing (Last.fm)

`app/api/now-playing/route.ts` (live line) and `app/lib/lastfm.ts` (the charts) read
`LASTFM_API_KEY` and `LASTFM_USERNAME` from the environment. Both are server only.
Set them on the host at deploy time.

Privacy, by construction:

- The response is a hand-built object of four fields (`isPlaying`, `title`, `artist`,
  `url`). Nothing from the upstream payload is forwarded, so the username, profile url,
  images, mbids and scrobble timestamps cannot leak.
- The track url is regex-gated to `https://www.last.fm/music/`, never a user-scoped url.
- 4 second shared server cache, so any number of visitors polling collapse onto at most
  one upstream call per window.
- 5 second upstream timeout, and failures are swallowed rather than surfaced.

The page polls every 5 seconds and pauses entirely while the tab is hidden.
