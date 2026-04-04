import { NextRequest, NextResponse } from "next/server";
import { refreshToken, getUserProfile } from "@/lib/spotify";
import { createServiceClient } from "@/lib/supabase";
import { calculateLoopIdentity } from "@/lib/loop-identity";
import type { PlaybackEvent } from "@/lib/loop-identity";
import CryptoJS from "crypto-js";

export async function GET(request: NextRequest) {
  // --- Auth ---
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshTokenValue = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken && refreshTokenValue) {
    try {
      const tokens = await refreshToken(refreshTokenValue);
      if (tokens.error) return NextResponse.json({ error: "Auth failed" }, { status: 401 });
      accessToken = tokens.access_token;
    } catch {
      return NextResponse.json({ error: "Auth failed" }, { status: 401 });
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // --- Get Spotify user profile ---
  let profile;
  try {
    profile = await getUserProfile(accessToken);
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  // Hash the Spotify ID for privacy
  const spotifyIdHash = CryptoJS.SHA256(profile.id).toString();

  // --- Get or create listener ---
  let { data: listener } = await supabase
    .from("listeners")
    .select("*")
    .eq("spotify_id_hash", spotifyIdHash)
    .single();

  if (!listener) {
    const { data: newListener, error } = await supabase
      .from("listeners")
      .insert({
        spotify_id_hash: spotifyIdHash,
        country: profile.country || null,
        account_type: profile.product || "free",
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newListener) {
      return NextResponse.json({ error: "Failed to create listener" }, { status: 500 });
    }
    listener = newListener;
  } else {
    // Update last_seen
    await supabase
      .from("listeners")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", listener.id);
  }

  // --- Fetch playback events for this listener ---
  const { data: events } = await supabase
    .from("playback_events")
    .select("*")
    .eq("listener_id", listener.id)
    .order("timestamp", { ascending: true });

  const playbackEvents: PlaybackEvent[] = (events || []).map((e) => ({
    id: e.id,
    track_id: e.track_id,
    track_name: e.track_name || "",
    position_ms: e.position_ms || 0,
    duration_ms: e.duration_ms || 0,
    completed: e.completed || false,
    skipped: e.skipped || false,
    timestamp: e.timestamp,
    hour_of_day: e.hour_of_day || 0,
    day_of_week: e.day_of_week || 0,
  }));

  // --- Calculate loop identity ---
  const identityResult = calculateLoopIdentity(playbackEvents);

  // --- Update listener with identity ---
  const isSuperListener = identityResult.identity === "LOVE";
  await supabase
    .from("listeners")
    .update({
      loop_identity: identityResult.identity,
      total_streams: playbackEvents.length,
      is_super_listener: isSuperListener,
    })
    .eq("id", listener.id);

  // --- Compute stats for the page ---
  const firstListen = playbackEvents.length > 0 ? playbackEvents[0].timestamp : null;
  const totalStreams = playbackEvents.length;

  // Favourite track
  const trackCounts = new Map<string, { count: number; name: string }>();
  for (const e of playbackEvents) {
    const existing = trackCounts.get(e.track_id);
    if (existing) existing.count++;
    else trackCounts.set(e.track_id, { count: 1, name: e.track_name });
  }
  let favouriteTrack = { name: "—", count: 0 };
  for (const [, { count, name }] of trackCounts) {
    if (count > favouriteTrack.count) favouriteTrack = { name, count };
  }

  // Album completions: count sessions where completed_album = true
  const { count: albumCompletions } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("listener_id", listener.id)
    .eq("completed_album", true);

  // Listening depth: avg tracks per session
  const { data: sessions } = await supabase
    .from("sessions")
    .select("tracks_played")
    .eq("listener_id", listener.id);

  const avgDepth =
    sessions && sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.tracks_played || 0), 0) / sessions.length
      : totalStreams > 0
      ? Math.min(totalStreams / Math.max(identityResult.breakdown.distinctDays, 1), 10)
      : 0;

  // Days as listener
  const daysAsListener = firstListen
    ? Math.ceil((Date.now() - new Date(firstListen).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return NextResponse.json({
    identity: identityResult.identity,
    confidence: identityResult.confidence,
    breakdown: identityResult.breakdown,
    stats: {
      firstListen,
      totalStreams,
      favouriteTrack: favouriteTrack.name,
      favouriteTrackCount: favouriteTrack.count,
      albumCompletions: albumCompletions || 0,
      listeningDepth: +avgDepth.toFixed(1),
      daysAsListener,
    },
    listenerId: listener.id,
  });
}
