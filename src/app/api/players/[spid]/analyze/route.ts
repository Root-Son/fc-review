import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { analyzeReviews } from "@/lib/ai-summary";
import { crawlInvenByPlayer } from "@/lib/crawler";
import type { Review } from "@/lib/types";

// POST: 특정 선수 리뷰 크롤링 + AI 분석
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

  // 2. 인벤에서 선수 이름으로 리뷰 크롤링
  const crawled = await crawlInvenByPlayer(player.name, 3);

  // 3. 크롤링된 리뷰 DB 저장 (중복 체크)
  let savedCount = 0;
  for (const r of crawled) {
    const targetSpid = r.spid || spidNum;

    // players 테이블에 존재하는지 확인
    const { data: exists } = await db
      .from("players")
      .select("spid")
      .eq("spid", targetSpid)
      .single();
    if (!exists) continue;

    // 중복 체크
    const { data: dup } = await db
      .from("reviews")
      .select("id")
      .eq("spid", targetSpid)
      .eq("content", r.content)
      .limit(1);
    if (dup && dup.length > 0) continue;

    const { error } = await db.from("reviews").insert({
      spid: targetSpid,
      source: r.source,
      author: r.author,
      content: r.content,
      rating: r.rating,
      source_url: r.source_url,
      source_date: r.source_date,
    });
    if (!error) savedCount++;
  }

  // 4. 해당 선수의 모든 리뷰 조회
  const { data: allReviews } = await db
    .from("reviews")
    .select("*")
    .eq("spid", spidNum);

  if (!allReviews || allReviews.length === 0) {
    return NextResponse.json({
      success: true,
      crawledCount: crawled.length,
      savedCount,
      totalReviews: 0,
      message: "리뷰가 수집되었지만 이 선수에 대한 리뷰는 없습니다",
    });
  }

  // 5. AI 분석
  let analysis;
  try {
    analysis = await analyzeReviews(
      player.name,
      player.season_name || "",
      allReviews as Review[]
    );
  } catch (e) {
    return NextResponse.json({
      error: "AI analysis failed",
      detail: String(e),
      crawledCount: crawled.length,
      savedCount,
      totalReviews: allReviews.length,
    }, { status: 500 });
  }

  // 6. 저장
  await db.from("ai_summaries").upsert({
    spid: spidNum,
    summary: analysis.summary,
    pros: analysis.pros,
    cons: analysis.cons,
    recommendations: analysis.recommendations,
    review_count: allReviews.length,
    updated_at: new Date().toISOString(),
  });

  await db.from("feel_stats").upsert({
    spid: spidNum,
    ...analysis.feelStats,
    review_count: allReviews.length,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    crawledCount: crawled.length,
    savedCount,
    totalReviews: allReviews.length,
    summary: analysis.summary,
  });
}
