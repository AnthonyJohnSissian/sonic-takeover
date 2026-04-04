import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  const storedState = request.cookies.get("spotify_auth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokens = await exchangeCode(code);

    if (tokens.error) {
      return NextResponse.redirect(new URL(`/?error=${tokens.error}`, request.url));
    }

    const response = NextResponse.redirect(new URL("/war-room", request.url));

    response.cookies.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    });

    response.cookies.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.delete("spotify_auth_state");

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/?error=exchange_failed", request.url));
  }
}
