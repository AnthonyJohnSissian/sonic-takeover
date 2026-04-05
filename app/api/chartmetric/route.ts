import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const CHARTMETRIC_API_KEY = process.env.CHARTMETRIC_API_KEY!;
const CHARTMETRIC_BASE = "https://api.chartmetric.com/api";
const CM_ARTIST_ID =
  process.env.CHARTMETRIC_ARTIST_ID || "PLACEHOLDER_SET_CHARTMETRIC_ARTIST_ID";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chartmetricRequest(
  endpoint: string,
  params?: Record<string, string>
) {
  const url = new URL(`${CHARTMETRIC_BASE}${endpoint}`);
  if (params)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${CHARTMETRIC_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    await sleep(retryAfter * 1000);
    return chartmetricRequest(endpoint, params);
  }

  if (!res.ok) throw new Error(`Chartmetric ${res.status}: ${await res.text()}`);
  return res.json();
}

async function pullArtistMetrics() {
  await sleep(1000);
  return chartmetricRequest(`/artist/${CM_ARTIST_ID}`);
}

async function pullPlaylistPlacements() {
  await sleep(1000);
  return chartmetricRequest(
    `/artist/${CM_ARTIST_ID}/playlist/spotify/current`,
    { limit: "100", offset: "0" }
  );
}

async function pullPressCoverage() {
  await sleep(1000);
  return chartmetricRequest(`/artist/${CM_ARTIST_ID}/links`, {
    type: "press",
    limit: "50",
  });
}

async function savePlaylistPlacements(placements: Record<string, unknown>[]) {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  for (const p of placements) {
    await supabase.from("playlist_placements").upsert(
      {
        playlist_name: p.name || p.playlist_name,
        playlist_id: p.id || p.playlist_id,
        owner: p.owner || p.curator_name,
        country: p.country,
        followers: p.followers || p.num_followers,
        is_editorial: p.editorial || false,
        track_name: p.track_title,
        track_position: p.current_position || p.position,
        added_at: p.added_at || today,
        platform: "SPOTIFY",
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "playlist_id,track_id" }
    );
    await sleep(100);
  }
}

async function savePressCoverage(articles: Record<string, unknown>[]) {
  const supabase = createServiceClient();

  for (const article of articles) {
    const exists = await supabase
      .from("press_coverage")
      .select("id")
      .eq("url", article.url)
      .single();

    if (!exists.data) {
      await supabase.from("press_coverage").insert({
        outlet: article.source || article.publisher,
        country: article.country,
        outlet_type: article.type || "blog",
        url: article.url,
        published_at: article.published_at || article.date,
        recorded_at: new Date().toISOString(),
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

  if (
    !CHARTMETRIC_API_KEY ||
    CHARTMETRIC_API_KEY === "CHARTMETRIC_API_KEY_PLACEHOLDER"
  ) {
    return NextResponse.json(
      {
        error: "CHARTMETRIC_API_KEY not configured",
        message: "Set CHARTMETRIC_API_KEY in environment variables",
      },
      { status: 503 }
    );
  }

  try {
    const results: Record<string, unknown> = {};

    try {
      results.metrics = await pullArtistMetrics();
    } catch (e: unknown) {
      results.metrics_error = e instanceof Error ? e.message : "Unknown";
    }

    try {
      const playlists = await pullPlaylistPlacements();
      if ((playlists as Record<string, unknown[]>)?.data)
        await savePlaylistPlacements(
          (playlists as Record<string, unknown[]>).data as Record<string, unknown>[]
        );
      results.playlists = {
        count: ((playlists as Record<string, unknown[]>)?.data as unknown[])?.length,
      };
    } catch (e: unknown) {
      results.playlists_error = e instanceof Error ? e.message : "Unknown";
    }

    try {
      const press = await pullPressCoverage();
      if ((press as Record<string, unknown[]>)?.data)
        await savePressCoverage(
          (press as Record<string, unknown[]>).data as Record<string, unknown>[]
        );
      results.press = {
        count: ((press as Record<string, unknown[]>)?.data as unknown[])?.length,
      };
    } catch (e: unknown) {
      results.press_error = e instanceof Error ? e.message : "Unknown";
    }

    return NextResponse.json({
      success: true,
      pulled_at: new Date().toISOString(),
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
