import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const season = req.nextUrl.searchParams.get("season");
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "20"),
    50
  );

  let query = supabase
    .from("players")
    .select("*")
    .order("ovr", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (season) {
    query = query.eq("season_id", parseInt(season));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
