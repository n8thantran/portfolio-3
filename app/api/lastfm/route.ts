import { NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache, we want real-time data

type LastFmTrack = {
  name: string;
  artist: {
    '#text': string;
  };
  album: {
    '#text': string;
  };
  image: Array<{
    '#text': string;
    size: string;
  }>;
  url: string;
  '@attr'?: {
    nowplaying: string;
  };
};

type LastFmResponse = {
  recenttracks: {
    track: LastFmTrack[];
  };
};

export async function GET() {
  const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
  const LASTFM_USERNAME = process.env.LASTFM_USERNAME || 'n8thantran';

  if (!LASTFM_API_KEY) {
    return NextResponse.json(
      { error: 'Last.fm API key not configured', isPlaying: false, track: null },
      { status: 200 }
    );
  }

  try {
    const params = new URLSearchParams({
      method: 'user.getrecenttracks',
      user: LASTFM_USERNAME,
      api_key: LASTFM_API_KEY,
      format: 'json',
      limit: '1',
    });

    const url = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;
    
    console.log('Fetching from Last.fm:', { username: LASTFM_USERNAME, hasApiKey: !!LASTFM_API_KEY });
    
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Last.fm API error:', response.status, response.statusText, errorText);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(errorText);
        console.error('Last.fm error details:', errorData);
      } catch (e) {
        // Not JSON, already logged as text
      }
      
      return NextResponse.json(
        { error: `Last.fm API error: ${response.statusText}`, isPlaying: false, track: null },
        { status: 200 }
      );
    }

    const data: LastFmResponse = await response.json();
    console.log('Last.fm response:', JSON.stringify(data, null, 2));
    const track = data.recenttracks?.track?.[0];

    if (!track) {
      return NextResponse.json(
        { isPlaying: false, track: null },
        { status: 200 }
      );
    }

    const isPlaying = track['@attr']?.nowplaying === 'true';
    const albumArt = track.image.find(img => img.size === 'large')?.['#text'] || 
                     track.image.find(img => img.size === 'medium')?.['#text'] || '';

    return NextResponse.json({
      isPlaying,
      track: {
        name: track.name,
        artist: track.artist['#text'],
        album: track.album['#text'],
        albumArt,
        url: track.url,
      },
    });
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Last.fm data', isPlaying: false, track: null },
      { status: 200 }
    );
  }
}
