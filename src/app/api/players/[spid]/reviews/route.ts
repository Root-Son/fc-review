import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ spid: string }> }
) {
  const { spid } = await params;
  const source = req.nextUrl.searchParams.get("source");
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "50"),
    100
  );
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  let query = supabase
    .from("reviews")
    .select("*")
    .eq("spid", parseInt(spid))
    .order("crawled_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data, total: count });
}
