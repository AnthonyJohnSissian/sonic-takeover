import { NextRequest, NextResponse } from "next/server";
import { getArtist, refreshToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshTokenValue = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken && refreshTokenValue) {
    const tokens = await refreshToken(refreshTokenValue);
    accessToken = tokens.access_token;
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const artist = await getArtist(accessToken);
    return NextResponse.json(artist);
  } catch (err) {
    console.error("Artist fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 });
  }
}
