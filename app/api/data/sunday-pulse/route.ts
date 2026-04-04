import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("sunday_pulse")
    .select("*")
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("Sunday pulse fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
