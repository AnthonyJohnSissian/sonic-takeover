import { NextRequest, NextResponse } from "next/server";
import { getCurrentlyPlaying, refreshToken } from "@/lib/spotify";

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
    const playing = await getCurrentlyPlaying(accessToken);
    return NextResponse.json(playing || { is_playing: false });
  } catch (err) {
    console.error("Now playing error:", err);
    return NextResponse.json({ is_playing: false });
  }
}
