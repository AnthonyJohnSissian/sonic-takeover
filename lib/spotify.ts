const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;
const TARGET_ARTIST_ID = process.env.TARGET_ARTIST_ID!;
const TARGET_ALBUM_ID = process.env.TARGET_ALBUM_ID!;

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-read-playback-state",
  "user-library-read",
  "user-top-read",
  "user-read-private",
  "user-read-email",
].join(" ");

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: "true",
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  return res.json();
}

export async function refreshToken(refresh_token: string) {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });
  return res.json();
}

export async function spotifyGet(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getArtist(accessToken: string) {
  return spotifyGet(`/artists/${TARGET_ARTIST_ID}`, accessToken);
}

export async function getAlbumTracks(accessToken: string) {
  return spotifyGet(`/albums/${TARGET_ALBUM_ID}/tracks?limit=50`, accessToken);
}

export async function getCurrentlyPlaying(accessToken: string) {
  return spotifyGet("/me/player/currently-playing", accessToken);
}

export async function getRecentlyPlayed(accessToken: string, limit = 50) {
  return spotifyGet(`/me/player/recently-played?limit=${limit}`, accessToken);
}

export async function getUserProfile(accessToken: string) {
  return spotifyGet("/me", accessToken);
}

export { TARGET_ARTIST_ID, TARGET_ALBUM_ID };
