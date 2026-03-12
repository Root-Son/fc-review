import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchSeasons } from "@/lib/nexon-api";

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

  // 시즌 이미지 URL
  const seasons = await fetchSeasons();
  const seasonImg = seasons.find((s) => s.seasonId === player.season_id)?.seasonImg || null;

  return NextResponse.json({
    player: { ...player, season_img: seasonImg },
    summary,
    feelStats,
    reviewCount: count || 0,
  });
}
