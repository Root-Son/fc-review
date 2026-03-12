"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import HexagonChart from "@/components/HexagonChart";
import RecommendationBadge from "@/components/RecommendationBadge";
import ReviewCard from "@/components/ReviewCard";
import type {
  Player,
  AiSummary,
  FeelStats,
  Review,
  Recommendation,
} from "@/lib/types";

interface PlayerData {
  player: Player;
  summary: AiSummary | null;
  feelStats: FeelStats | null;
  reviewCount: number;
}

export default function PlayerPage({
  params,
}: {
  params: Promise<{ spid: string }>;
}) {
  const { spid } = use(params);
  const [data, setData] = useState<PlayerData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "reviews">("summary");

  useEffect(() => {
    fetchPlayerData();
    fetchReviews();
  }, [spid]);

  async function fetchPlayerData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${spid}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/players/${spid}/reviews`);
      if (res.ok) {
        const json = await res.json();
        setReviews(json.reviews || []);
      }
    } catch {
      /* ignore */
    }
  }

  async function triggerAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/players/${spid}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        // 분석 완료 후 데이터 새로고침
        await fetchPlayerData();
        await fetchReviews();
      }
    } catch {
      /* ignore */
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">
        선수를 찾을 수 없습니다
      </div>
    );
  }

  const { player, summary, feelStats, reviewCount } = data;

  return (
    <div>
      {/* 선수 헤더 */}
      <div className="flex items-start gap-5 mb-8">
        {player.image_url && (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 shrink-0">
            <Image
              src={player.image_url}
              alt={player.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {player.season_name && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                {player.season_name}
              </span>
            )}
            {player.position && (
              <span className="text-xs text-slate-400">{player.position}</span>
            )}
          </div>
          <h1 className="text-2xl font-black">{player.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
            {player.ovr && (
              <span className="text-yellow-400 font-semibold">
                OVR {player.ovr}
              </span>
            )}
            <span>{reviewCount}개의 리뷰</span>
          </div>
        </div>

        {/* 분석 버튼 */}
        <button
          onClick={triggerAnalysis}
          disabled={analyzing}
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-sm transition-all disabled:opacity-50"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              분석중...
            </span>
          ) : (
            "🤖 AI 분석 실행"
          )}
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "summary"
              ? "text-blue-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          AI 분석
          {activeTab === "summary" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "reviews"
              ? "text-blue-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          리뷰 ({reviewCount})
          {activeTab === "reviews" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "summary" ? (
        <div>
          {summary ? (
            <div className="space-y-6">
              {/* AI 요약 */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="text-blue-400">🤖</span> AI 리뷰
                  요약
                  <span className="text-xs text-slate-500 font-normal">
                    ({summary.review_count}개 리뷰 기반)
                  </span>
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {summary.summary}
                </p>

                {/* 장단점 */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="text-xs font-semibold text-green-400 mb-2">
                      장점
                    </h3>
                    <ul className="space-y-1">
                      {summary.pros.map((pro, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-400 flex items-start gap-1.5"
                        >
                          <span className="text-green-400 mt-0.5">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-red-400 mb-2">
                      단점
                    </h3>
                    <ul className="space-y-1">
                      {summary.cons.map((con, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-400 flex items-start gap-1.5"
                        >
                          <span className="text-red-400 mt-0.5">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 체감 스탯 차트 */}
              {feelStats && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="text-cyan-400">📊</span> 체감
                    스탯
                  </h2>
                  <div className="flex justify-center">
                    <HexagonChart
                      stats={{
                        shooting_feel: feelStats.shooting_feel,
                        physical_feel: feelStats.physical_feel,
                        pass_accuracy_feel: feelStats.pass_accuracy_feel,
                        weak_foot_feel: feelStats.weak_foot_feel,
                        skill_move_feel: feelStats.skill_move_feel,
                        overall_feel: feelStats.overall_feel,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 맞춤 추천 */}
              {summary.recommendations && summary.recommendations.length > 0 && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="text-yellow-400">🎯</span> 맞춤
                    추천
                  </h2>
                  <div className="space-y-2">
                    {summary.recommendations.map(
                      (rec: Recommendation, i: number) => (
                        <RecommendationBadge key={i} rec={rec} />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg mb-2">아직 AI 분석이 없습니다</p>
              <p className="text-sm mb-4">
                &quot;AI 분석 실행&quot; 버튼을 눌러 리뷰를 수집하고 분석을
                시작하세요
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>아직 수집된 리뷰가 없습니다</p>
              <p className="text-sm mt-1">
                AI 분석을 실행하면 리뷰가 자동으로 수집됩니다
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
