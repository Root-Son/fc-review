import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ spid: string }> }
) {
  const { spid } = await params;
  const spidNum = parseInt(spid);

  // 선수 기본 정보
  const { data: player, error: playerErr } = await supabase
    .from("players")
    .select("*")
    .eq("spid", spidNum)
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // AI 요약
  const { data: summary } = await supabase
    .from("ai_summaries")
    .select("*")
    .eq("spid", spidNum)
    .single();

  // 체감 스탯
  const { data: feelStats } = await supabase
    .from("feel_stats")
    .select("*")
    .eq("spid", spidNum)
    .single();

  // 리뷰 수
  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("spid", spidNum);

  return NextResponse.json({
    player,
    summary,
    feelStats,
    reviewCount: count || 0,
  });
}
