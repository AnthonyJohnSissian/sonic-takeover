import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("growth_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: true });

  if (error) {
    console.error("Growth fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
