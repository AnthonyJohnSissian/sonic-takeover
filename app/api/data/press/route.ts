import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("press_coverage")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Press fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
