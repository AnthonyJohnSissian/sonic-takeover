import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
const ARTIST_ID = process.env.NEXT_PUBLIC_ARTIST_ID!;

async function firecrawlRequest(endpoint: string, method: string, body?: object) {
  const res = await fetch(`${FIRECRAWL_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Firecrawl error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function scrapeSpotifyForArtists() {
  const scrapeResult = await firecrawlRequest("/scrape", "POST", {
    url: `https://artists.spotify.com/artist/${ARTIST_ID}/audience/overview`,
    formats: ["markdown"],
    proxy: "enhanced",
    profile: {
      name: "spotify-artists-session",
      save_changes: true,
    },
    waitFor: 3000,
  });

  const scrapeId = scrapeResult.id || scrapeResult.metadata?.scrapeId;

  if (
    scrapeResult.markdown?.includes("Log in") ||
    scrapeResult.markdown?.includes("sign in")
  ) {
    return {
      status: "needs_auth",
      liveViewUrl: scrapeResult.metadata?.interactiveLiveViewUrl,
      message:
        "Open the live view URL in browser and log in to Spotify for Artists. Session will be saved automatically.",
    };
  }

  const interactResult = await firecrawlRequest(
    `/scrape/${scrapeId}/interact`,
    "POST",
    {
      prompt: `You are viewing the Spotify for Artists analytics dashboard for artist ID ${ARTIST_ID}.
    Extract ALL visible statistics and return as JSON with this exact structure:
    {
      "monthly_listeners": number,
      "total_streams": number,
      "followers": number,
      "countries_count": number,
      "super_listeners": number,
      "active_listeners": number,
      "top_tracks": [{"track_name": string, "streams": number, "listeners": number, "saves": number}],
      "top_countries": [{"country": string, "listeners": number}],
      "saves_last_28_days": number,
      "playlist_adds_last_7_days": number
    }
    If a field is not visible, use null. Extract actual numbers, not percentages.`,
    }
  );

  await firecrawlRequest(`/scrape/${scrapeId}/interact`, "DELETE");

  return { status: "success", data: interactResult };
}

async function saveToSupabase(data: Record<string, unknown>) {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  await supabase.from("spotify_daily").upsert(
    {
      snapshot_date: today,
      monthly_listeners: data.monthly_listeners,
      total_streams: data.total_streams,
      followers: data.followers,
      countries_count: data.countries_count,
      super_listeners: data.super_listeners,
      active_listeners: data.active_listeners,
      saves: data.saves_last_28_days,
      playlist_adds: data.playlist_adds_last_7_days,
      source: "firecrawl",
    },
    { onConflict: "snapshot_date" }
  );

  const topTracks = data.top_tracks as Array<Record<string, unknown>> | undefined;
  if (topTracks?.length) {
    for (const track of topTracks) {
      await supabase.from("track_daily").upsert(
        {
          snapshot_date: today,
          track_name: track.track_name,
          track_id: String(track.track_name)
            .toLowerCase()
            .replace(/\s+/g, "_")
            .slice(0, 20),
          streams: track.streams,
          listeners: track.listeners,
          saves: track.saves,
        },
        { onConflict: "snapshot_date,track_id" }
      );
    }
  }

  const topCountries = data.top_countries as Array<Record<string, unknown>> | undefined;
  if (topCountries?.length) {
    for (const geo of topCountries) {
      await supabase.from("geographic_data").insert({
        snapshot_date: today,
        country: geo.country,
        listener_count: geo.listeners,
        stream_count: geo.listeners,
      });
    }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeSpotifyForArtists();

    if (result.status === "needs_auth") {
      return NextResponse.json(result, { status: 200 });
    }

    let parsedData: Record<string, unknown> | null = null;
    try {
      const output =
        (result.data as Record<string, string>)?.output ||
        (result.data as Record<string, string>)?.result ||
        "";
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse Firecrawl response:", e);
      return NextResponse.json(
        { error: "Parse failed", raw: result.data },
        { status: 500 }
      );
    }

    if (parsedData) {
      await saveToSupabase(parsedData);
    }

    return NextResponse.json({
      success: true,
      scraped_at: new Date().toISOString(),
      data: parsedData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Firecrawl scrape error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
