import { NextRequest, NextResponse } from "next/server";
import { refreshToken, TARGET_ALBUM_ID } from "@/lib/spotify";
import { createServiceClient } from "@/lib/supabase";

const COMPLETION_THRESHOLD = 0.8;
const SKIP_THRESHOLD_MS = 30000;

interface SpotifyDevice {
  device_type?: string;
  type?: string;
  name?: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
}

interface SpotifyPlaybackResponse {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  device?: SpotifyDevice;
  timestamp?: number;
}

export async function GET(request: NextRequest) {
  // --- Auth: extract Spotify access token from httpOnly cookie ---
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshTokenValue = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken && refreshTokenValue) {
    try {
      const tokens = await refreshToken(refreshTokenValue);
      if (tokens.error) {
        return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
      }
      accessToken = tokens.access_token;

      // Persist the new access token
      const response = buildResponse({ playing: false, track: null, position: 0, completed: false });
      response.cookies.set("spotify_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in,
      });
      // Don't return early — we'll build the real response below
    } catch {
      return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // --- Call Spotify currently-playing with retry on 429 ---
  let playback: SpotifyPlaybackResponse | null = null;
  let backoffMs = 1000;
  const MAX_BACKOFF = 16000;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : backoffMs;
      await sleep(Math.min(waitMs, MAX_BACKOFF));
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF);
      continue;
    }

    if (res.status === 204 || res.status === 202) {
      // No active playback
      return buildResponse({ playing: false, track: null, position: 0, completed: false });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Spotify API error: ${res.status}` },
        { status: res.status }
      );
    }

    playback = await res.json();
    break;
  }

  if (!playback || !playback.item) {
    return buildResponse({ playing: false, track: null, position: 0, completed: false });
  }

  const track = playback.item;
  const isTargetAlbum = track.album.id === TARGET_ALBUM_ID;
  const positionMs = playback.progress_ms || 0;
  const durationMs = track.duration_ms;
  const completed = positionMs > durationMs * COMPLETION_THRESHOLD;

  // --- If NOT from target album, return status only ---
  if (!isTargetAlbum) {
    return buildResponse({
      playing: playback.is_playing,
      track: track.name,
      position: positionMs,
      completed: false,
    });
  }

  // --- Target album track: record everything ---
  const supabase = createServiceClient();
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const hourOfDay = now.getUTCHours();
  const deviceType = playback.device?.type || playback.device?.device_type || "unknown";
  const deviceName = playback.device?.name || "unknown";

  // Get or create listener from cookie-based identity
  const listenerId = request.cookies.get("listener_id")?.value;

  // --- Determine repeated: check last event for this listener ---
  let repeated = false;
  if (listenerId) {
    const { data: lastEvent } = await supabase
      .from("playback_events")
      .select("track_id")
      .eq("listener_id", listenerId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (lastEvent?.track_id === track.id) {
      repeated = true;
    }
  }

  const skipped = positionMs < SKIP_THRESHOLD_MS;

  // --- Insert playback event ---
  const eventData = {
    listener_id: listenerId || null,
    track_id: track.id,
    track_name: track.name,
    position_ms: positionMs,
    duration_ms: durationMs,
    is_playing: playback.is_playing,
    device_type: deviceType,
    device_name: deviceName,
    completed,
    skipped,
    repeated,
    timestamp: now.toISOString(),
    day_of_week: dayOfWeek,
    hour_of_day: hourOfDay,
    listener_timezone: "UTC",
  };

  const { error: insertError } = await supabase
    .from("playback_events")
    .insert(eventData);

  if (insertError) {
    console.error("Playback event insert error:", insertError);
  }

  // --- Update track_stats ---
  await updateTrackStats(supabase, track.id, track.name, completed, skipped, repeated);

  // --- Sunday pulse: upsert if day_of_week === 0 ---
  if (dayOfWeek === 0) {
    await upsertSundayPulse(supabase, now, hourOfDay);
  }

  // --- Broadcast to Supabase Realtime ---
  await supabase.channel("live-playback").send({
    type: "broadcast",
    event: "playback",
    payload: {
      track_name: track.name,
      track_id: track.id,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      device_type: deviceType,
      position_ms: positionMs,
      duration_ms: durationMs,
      completed,
      timestamp: now.toISOString(),
    },
  });

  return buildResponse({
    playing: playback.is_playing,
    track: track.name,
    position: positionMs,
    completed,
  });
}

// --- Helper: update track_stats with running averages ---
async function updateTrackStats(
  supabase: ReturnType<typeof createServiceClient>,
  trackId: string,
  trackName: string,
  completed: boolean,
  skipped: boolean,
  repeated: boolean
) {
  // Fetch current stats
  const { data: existing } = await supabase
    .from("track_stats")
    .select("*")
    .eq("track_id", trackId)
    .single();

  if (existing) {
    const newTotal = existing.total_streams + 1;
    const completedCount = Math.round(existing.completion_rate * existing.total_streams) + (completed ? 1 : 0);
    const skippedCount = Math.round(existing.skip_rate * existing.total_streams) + (skipped ? 1 : 0);
    const repeatedCount = Math.round(existing.repeat_rate * existing.total_streams) + (repeated ? 1 : 0);

    await supabase
      .from("track_stats")
      .update({
        total_streams: newTotal,
        completion_rate: completedCount / newTotal,
        skip_rate: skippedCount / newTotal,
        repeat_rate: repeatedCount / newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("track_id", trackId);
  } else {
    // First time seeing this track
    await supabase.from("track_stats").insert({
      track_id: trackId,
      track_name: trackName,
      total_streams: 1,
      unique_listeners: 1,
      completion_rate: completed ? 1 : 0,
      skip_rate: skipped ? 1 : 0,
      repeat_rate: repeated ? 1 : 0,
      save_rate: 0,
    });
  }
}

// --- Helper: upsert sunday_pulse for current hour ---
async function upsertSundayPulse(
  supabase: ReturnType<typeof createServiceClient>,
  now: Date,
  hourUtc: number
) {
  const today = now.toISOString().split("T")[0];

  // Check if entry exists for this Sunday + hour
  const { data: existing } = await supabase
    .from("sunday_pulse")
    .select("id, stream_count, listener_count")
    .eq("day_of_week", 0)
    .eq("hour_utc", hourUtc)
    .gte("recorded_at", `${today}T00:00:00Z`)
    .lte("recorded_at", `${today}T23:59:59Z`)
    .single();

  if (existing) {
    await supabase
      .from("sunday_pulse")
      .update({
        stream_count: existing.stream_count + 1,
        listener_count: existing.listener_count,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("sunday_pulse").insert({
      recorded_at: now.toISOString(),
      day_of_week: 0,
      hour_utc: hourUtc,
      stream_count: 1,
      listener_count: 1,
    });
  }
}

// --- Helper: build standardized JSON response ---
function buildResponse(data: {
  playing: boolean;
  track: string | null;
  position: number;
  completed: boolean;
}) {
  return NextResponse.json(data);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
