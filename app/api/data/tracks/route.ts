import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("track_stats")
    .select("*")
    .order("total_streams", { ascending: false });

  if (error) {
    console.error("Tracks fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
