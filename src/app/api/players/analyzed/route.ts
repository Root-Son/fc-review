import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: AI 분석이 완료된 선수 목록
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const position = req.nextUrl.searchParams.get("position") || "";

  // ai_summaries에 있는 spid 목록 조회
  const { data: summaries } = await supabase
    .from("ai_summaries")
    .select("spid, summary, review_count");

  if (!summaries || summaries.length === 0) {
    return NextResponse.json([]);
  }

  const spids = summaries.map((s) => s.spid);

  // 해당 선수 정보 조회
  let query = supabase
    .from("players")
    .select("*")
    .in("spid", spids)
    .order("ovr", { ascending: false, nullsFirst: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (position) {
    query = query.eq("position", position);
  }

  const { data: players, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // summary 정보 합치기
  const summaryMap = new Map(summaries.map((s) => [s.spid, s]));
  const result = (players || []).map((p) => {
    const s = summaryMap.get(p.spid);
    return {
      ...p,
      review_count: s?.review_count || 0,
      summary_preview: s?.summary?.slice(0, 80) || "",
    };
  });

  return NextResponse.json(result);
}
