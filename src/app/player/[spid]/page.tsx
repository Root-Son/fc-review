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
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "reviews">(
    "summary"
  );
  useEffect(() => {
    loadData();
  }, [spid]);

  async function loadData() {
    setLoading(true);
    try {
      const [dataRes, revRes] = await Promise.all([
        fetch(`/api/players/${spid}`),
        fetch(`/api/players/${spid}/reviews`),
      ]);
      if (dataRes.ok) setData(await dataRes.json());
      if (revRes.ok) {
        const revJson = await revRes.json();
        setReviews(revJson.reviews || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function triggerAnalysis() {
    setAnalyzing(true);
    setAnalyzeStatus("리뷰를 수집하고 있습니다...");
    try {
      const res = await fetch(`/api/players/${spid}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        setAnalyzeStatus("분석 완료!");
        // 새로고침
        const dataRes = await fetch(`/api/players/${spid}`);
        if (dataRes.ok) setData(await dataRes.json());
        const revRes = await fetch(`/api/players/${spid}/reviews`);
        if (revRes.ok) {
          const revJson = await revRes.json();
          setReviews(revJson.reviews || []);
        }
      } else {
        const err = await res.json();
        setAnalyzeStatus(
          err.error === "No reviews available for analysis"
            ? "수집된 리뷰가 없어 분석을 진행할 수 없습니다"
            : "분석 중 오류가 발생했습니다"
        );
      }
    } catch {
      setAnalyzeStatus("분석 중 오류가 발생했습니다");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">선수 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-xl mb-2">선수를 찾을 수 없습니다</p>
        <a href="/" className="text-blue-400 text-sm hover:underline">
          돌아가기
        </a>
      </div>
    );
  }

  const { player, summary, feelStats, reviewCount } = data;
  const imgUrl = `https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/playersAction/p${player.spid}.png`;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 선수 헤더 */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 p-6 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-5 relative">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-800/80 shrink-0 border border-slate-700/30">
            <Image
              src={imgUrl}
              alt={player.name}
              fill
              className="object-contain"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {player.season_id && (
                <img
                  src={`https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/seasonImg/seasonicon_${player.season_id}.png`}
                  alt={player.season_name || ""}
                  className="h-5 w-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const span = document.createElement("span");
                    span.className = "text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold";
                    span.textContent = player.season_name || "";
                    target.parentNode?.insertBefore(span, target);
                  }}
                />
              )}
              {player.position && (
                <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300">
                  {player.position}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              {player.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              {player.ovr && (
                <span className="text-lg text-yellow-400 font-bold">
                  OVR {player.ovr}
                </span>
              )}
              <span className="text-sm text-slate-500">
                {reviewCount}개의 리뷰
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 분석 중 상태 */}
      {analyzing && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm text-blue-300 font-medium">
              AI 분석 진행 중
            </p>
            <p className="text-xs text-blue-400/70">{analyzeStatus}</p>
          </div>
        </div>
      )}

      {/* 분석 실패 메시지 */}
      {!analyzing && analyzeStatus && !summary && (
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-400">{analyzeStatus}</p>
          <button
            onClick={triggerAnalysis}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {(["summary", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "summary" ? "AI 분석" : `리뷰 (${reviewCount})`}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />
            )}
          </button>
        ))}
        {summary && (
          <button
            onClick={triggerAnalysis}
            disabled={analyzing}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 my-1.5"
          >
            재분석
          </button>
        )}
      </div>

      {activeTab === "summary" ? (
        <div>
          {summary ? (
            <div className="space-y-5">
              {/* AI 요약 */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/30 p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  AI 리뷰 요약
                  <span className="text-xs text-slate-500 font-normal">
                    {summary.review_count}개 리뷰 분석
                  </span>
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {summary.summary}
                </p>

                <div className="grid sm:grid-cols-2 gap-5 mt-5">
                  <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-4">
                    <h3 className="text-xs font-bold text-green-400 mb-3 uppercase tracking-wider">
                      Pros
                    </h3>
                    <ul className="space-y-2">
                      {summary.pros.map((pro, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-green-400 text-xs mt-1">
                            ●
                          </span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                    <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">
                      Cons
                    </h3>
                    <ul className="space-y-2">
                      {summary.cons.map((con, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-red-400 text-xs mt-1">●</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 체감 스탯 + 맞춤 추천 가로 배치 */}
              <div className="grid lg:grid-cols-2 gap-5">
                {/* 체감 스탯 차트 */}
                {feelStats && (
                  <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/30 p-6">
                    <h2 className="text-base font-bold text-white mb-4">
                      체감 스탯
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
                {summary.recommendations &&
                  summary.recommendations.length > 0 && (
                    <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/30 p-6">
                      <h2 className="text-base font-bold text-white mb-4">
                        맞춤 추천
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
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-3xl">
                📋
              </div>
              <p className="text-lg mb-2">아직 분석 데이터가 준비되지 않았습니다</p>
              <p className="text-sm text-slate-600">
                이 선수의 리뷰가 수집되면 AI 분석이 자동으로 생성됩니다
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
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg mb-1">수집된 리뷰가 없습니다</p>
              <p className="text-sm text-slate-600">
                AI 분석이 완료되면 리뷰가 표시됩니다
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
