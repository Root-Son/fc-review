import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { analyzeReviews } from "@/lib/ai-summary";
import { crawlAllReviews } from "@/lib/crawler";
import type { Review } from "@/lib/types";

// POST: 리뷰 크롤링 + AI 분석 트리거
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ spid: string }> }
) {
  const { spid } = await params;
  const spidNum = parseInt(spid);
  const db = getServiceSupabase();

  // 1. 선수 정보 확인
  const { data: player } = await db
    .from("players")
    .select("name, season_name")
    .eq("spid", spidNum)
    .single();

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // 2. 리뷰 크롤링 (선수 이름 전달하여 인벤 검색)
  const crawled = await crawlAllReviews(spidNum, player.name);

  // 3. 크롤링된 리뷰 DB 저장
  if (crawled.length > 0) {
    const rows = crawled.map((r) => ({
      spid: spidNum,
      source: r.source,
      author: r.author,
      content: r.content,
      rating: r.rating,
      source_url: r.source_url,
      source_date: r.source_date,
    }));
    await db.from("reviews").upsert(rows, { ignoreDuplicates: true });
  }

  // 4. DB에서 모든 리뷰 조회
  const { data: allReviews } = await db
    .from("reviews")
    .select("*")
    .eq("spid", spidNum);

  if (!allReviews || allReviews.length === 0) {
    return NextResponse.json(
      { error: "No reviews available for analysis", crawled: crawled.length },
      { status: 400 }
    );
  }

  // 5. AI 분석
  const analysis = await analyzeReviews(
    player.name,
    player.season_name || "",
    allReviews as Review[]
  );

  // 6. AI 요약 저장
  await db.from("ai_summaries").upsert({
    spid: spidNum,
    summary: analysis.summary,
    pros: analysis.pros,
    cons: analysis.cons,
    recommendations: analysis.recommendations,
    review_count: allReviews.length,
    updated_at: new Date().toISOString(),
  });

  // 7. 체감 스탯 저장
  await db.from("feel_stats").upsert({
    spid: spidNum,
    ...analysis.feelStats,
    review_count: allReviews.length,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    crawledCount: crawled.length,
    totalReviews: allReviews.length,
    summary: analysis.summary,
    recommendations: analysis.recommendations,
    feelStats: analysis.feelStats,
  });
}
