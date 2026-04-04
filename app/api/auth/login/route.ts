import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/spotify";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const url = getAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
