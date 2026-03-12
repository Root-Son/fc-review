import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { crawlInvenBatch, crawlYoutubeBatch } from "@/lib/crawler";
import { analyzeReviews } from "@/lib/ai-summary";
import type { Review } from "@/lib/types";

// POST: 배치 크롤링 + AI 분석
// ?mode=crawl    → 인벤 리뷰 배치 크롤링
// ?mode=youtube  → 유튜브 리뷰 크롤링
// ?mode=analyze  → 리뷰 있는 선수 중 AI 분석 없는 선수 분석
// ?mode=all      → 크롤링 + 분석 모두
// ?pages=10      → 크롤링할 페이지 수
// ?analyzeLimit=5 → 한번에 분석할 선수 수
export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") || "all";
  const pages = parseInt(req.nextUrl.searchParams.get("pages") || "10");
  const analyzeLimit = parseInt(
    req.nextUrl.searchParams.get("analyzeLimit") || "5"
  );
  const db = getServiceSupabase();
  const results: Record<string, unknown> = {};

  // === STEP 1: 크롤링 ===
  if (mode === "crawl" || mode === "all") {
    const crawled = await crawlInvenBatch(pages);
    let saved = 0;

    for (const r of crawled) {
      if (!r.spid) continue;

      // 해당 선수가 players 테이블에 있는지 확인
      const { data: player } = await db
        .from("players")
        .select("spid")
        .eq("spid", r.spid)
        .single();

      if (!player) continue;

      // 중복 체크 (같은 spid + 같은 content)
      const { data: existing } = await db
        .from("reviews")
        .select("id")
        .eq("spid", r.spid)
        .eq("content", r.content)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error } = await db.from("reviews").insert({
        spid: r.spid,
        source: r.source,
        author: r.author,
        content: r.content,
        rating: r.rating,
        source_url: r.source_url,
        source_date: r.source_date,
      });

      if (!error) saved++;
    }

    results.crawl = { total: crawled.length, saved };
  }

  // === STEP 1.5: 유튜브 크롤링 ===
  if (mode === "youtube") {
    const maxVideos = parseInt(req.nextUrl.searchParams.get("maxVideos") || "10");
    const crawled = await crawlYoutubeBatch(maxVideos);
    let saved = 0;

    for (const r of crawled) {
      // 유튜브 리뷰는 source_url로 중복 체크
      const { data: existing } = await db
        .from("reviews")
        .select("id")
        .eq("source_url", r.source_url)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // spid가 없으면 playerName으로 매칭 시도
      let spid = r.spid;
      if (!spid && r.playerName) {
        const { data: player } = await db
          .from("players")
          .select("spid")
          .ilike("name", `%${r.playerName}%`)
          .limit(1)
          .single();
        if (player) spid = player.spid;
      }

      if (!spid) continue; // FK 제약: spid 필수

      const { error } = await db.from("reviews").insert({
        spid,
        source: "youtube",
        author: r.author,
        content: r.content,
        rating: null,
        source_url: r.source_url,
        source_date: r.source_date,
      });

      if (!error) saved++;
    }

    results.youtube = { total: crawled.length, saved };
  }

  // === STEP 2: AI 분석 ===
  if (mode === "analyze" || mode === "all") {
    // 리뷰가 있지만 AI 분석이 없는 선수 찾기
    const { data: reviewedSpids } = await db
      .from("reviews")
      .select("spid")
      .limit(1000);

    if (reviewedSpids) {
      const uniqueSpids = [...new Set(reviewedSpids.map((r) => r.spid))];

      // AI 분석이 이미 있는 선수 제외
      const { data: analyzedSpids } = await db
        .from("ai_summaries")
        .select("spid");
      const analyzedSet = new Set(
        (analyzedSpids || []).map((a) => a.spid)
      );

      const needAnalysis = uniqueSpids.filter(
        (spid) => !analyzedSet.has(spid)
      );
      const toAnalyze = needAnalysis.slice(0, analyzeLimit);

      const analyzed: number[] = [];
      const failed: number[] = [];

      for (const spid of toAnalyze) {
        try {
          // 선수 정보
          const { data: player } = await db
            .from("players")
            .select("name, season_name")
            .eq("spid", spid)
            .single();

          if (!player) continue;

          // 리뷰 가져오기
          const { data: reviews } = await db
            .from("reviews")
            .select("*")
            .eq("spid", spid);

          if (!reviews || reviews.length < 1) continue;

          // AI 분석
          const analysis = await analyzeReviews(
            player.name,
            player.season_name || "",
            reviews as Review[]
          );

          // 저장
          await db.from("ai_summaries").upsert({
            spid,
            summary: analysis.summary,
            pros: analysis.pros,
            cons: analysis.cons,
            recommendations: analysis.recommendations,
            review_count: reviews.length,
            updated_at: new Date().toISOString(),
          });

          await db.from("feel_stats").upsert({
            spid,
            ...analysis.feelStats,
            review_count: reviews.length,
            updated_at: new Date().toISOString(),
          });

          analyzed.push(spid);
        } catch (e) {
          console.error(`[Batch] AI 분석 실패: spid=${spid}`, e);
          failed.push(spid);
        }
      }

      results.analyze = {
        needAnalysis: needAnalysis.length,
        attempted: toAnalyze.length,
        analyzed,
        failed,
      };
    }
  }

  return NextResponse.json({ success: true, ...results });
}
