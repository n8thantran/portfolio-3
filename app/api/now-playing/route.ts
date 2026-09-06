// Now playing: the track comes from Last.fm, the link points at Spotify.
//
// Everything identifying stays on the server: the Last.fm key and username are
// read from env and never leave this file. The response is a hand-built object
// with exactly four fields, so no part of the upstream payload (username,
// profile url, images, mbids, scrobble timestamps) can leak by accident.

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

export type NowPlaying = {
  configured: boolean;
  isPlaying: boolean;
  title?: string;
  artist?: string;
  url?: string;
};

const NOT_CONFIGURED: NowPlaying = { configured: false, isPlaying: false };

// Shared cache: the page polls every 5s, and this keeps any number of visitors
// collapsing onto at most one upstream call per window.
const CACHE_MS = 4_000;
let cache: { at: number; value: NowPlaying } | null = null;

/* -------------------------------------------------------------- spotify --- */

let appToken: { value: string; expiresAt: number } | null = null;

// Resolved links, keyed by track. Spotify search results do not change, so this
// keeps a long running server to one search per distinct song.
const resolved = new Map<string, string>();
const RESOLVED_MAX = 200;

function searchFallback(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

async function getAppToken(id: string, secret: string): Promise<string | null> {
  if (appToken && Date.now() < appToken.expiresAt) return appToken.value;

  try {
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;

    appToken = {
      value: data.access_token,
      expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000,
    };
    return appToken.value;
  } catch {
    return null;
  }
}

// Client credentials only: an app level token, tied to no Spotify account.
async function spotifyLink(title: string, artist: string): Promise<string> {
  const key = `${title}|${artist}`;
  const hit = resolved.get(key);
  if (hit) return hit;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return searchFallback(title, artist);

  const token = await getAppToken(id, secret);
  if (!token) return searchFallback(title, artist);

  try {
    const params = new URLSearchParams({
      q: `track:"${title}" artist:"${artist}"`,
      type: "track",
      limit: "1",
    });
    const res = await fetch(`${SPOTIFY_SEARCH_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return searchFallback(title, artist);

    const data = (await res.json()) as {
      tracks?: { items?: { external_urls?: { spotify?: string } }[] };
    };
    const url = data.tracks?.items?.[0]?.external_urls?.spotify;

    // Only ever hand back a plain track page.
    if (!url || !/^https:\/\/open\.spotify\.com\/track\//.test(url)) {
      return searchFallback(title, artist);
    }

    if (resolved.size >= RESOLVED_MAX) resolved.clear();
    resolved.set(key, url);
    return url;
  } catch {
    return searchFallback(title, artist);
  }
}

/* --------------------------------------------------------------- last.fm --- */

type LastfmTrack = {
  name?: string;
  artist?: { "#text"?: string; name?: string };
  "@attr"?: { nowplaying?: string };
};

function read(track: LastfmTrack | undefined) {
  const title = track?.name?.trim();
  const artist = (track?.artist?.["#text"] ?? track?.artist?.name)?.trim();
  if (!title || !artist) return null;
  return {
    title,
    artist,
    isPlaying: track?.["@attr"]?.nowplaying === "true",
  };
}

export async function GET() {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USERNAME;

  const headers = { "Cache-Control": "no-store" };

  if (!key || !user) return Response.json(NOT_CONFIGURED, { headers });

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Response.json(cache.value, { headers });
  }

  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    user,
    api_key: key,
    format: "json",
    limit: "1",
  });

  let value: NowPlaying = { configured: true, isPlaying: false };

  try {
    const res = await fetch(`${LASTFM_API}?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "nathan-site" },
    });

    if (res.ok) {
      const data = (await res.json()) as {
        recenttracks?: { track?: LastfmTrack | LastfmTrack[] };
      };
      const raw = data.recenttracks?.track;
      const track = read(Array.isArray(raw) ? raw[0] : raw);

      if (track) {
        value = {
          configured: true,
          isPlaying: track.isPlaying,
          title: track.title,
          artist: track.artist,
          url: await spotifyLink(track.title, track.artist),
        };
      }
    }
  } catch {
    // upstream slow, down, or rate limited: fall through with the empty value
    // and never surface the reason to the client
  }

  cache = { at: Date.now(), value };
  return Response.json(value, { headers });
}
