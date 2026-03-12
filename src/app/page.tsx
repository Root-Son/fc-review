"use client";

import { useState, useCallback } from "react";
import PlayerCard from "@/components/PlayerCard";
import type { Player } from "@/lib/types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(query.trim())}&limit=30`
      );
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-12">
        <h1 className="text-3xl font-black mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            FC Online
          </span>{" "}
          선수 리뷰 통합
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          공홈, 인벤, 피온북의 리뷰를 한곳에서 확인하고
          <br />
          AI가 분석한 체감 스탯과 맞춤 추천을 받아보세요
        </p>
      </div>

      {/* 검색 */}
      <div className="max-w-lg mx-auto mb-10">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="선수 이름을 검색하세요 (예: 손흥민, 메시)"
            className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "검색중..." : "검색"}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {searched && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : players.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {players.map((player) => (
                <PlayerCard key={player.spid} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg mb-1">검색 결과가 없습니다</p>
              <p className="text-sm">다른 선수 이름으로 검색해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 설명 */}
      {!searched && (
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-sm mb-1">리뷰 통합</h3>
            <p className="text-xs text-slate-400">
              공홈, 인벤, 피온북 등 여러 사이트에 흩어진 선수 리뷰를 한곳에서
              확인
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-sm mb-1">AI 분석</h3>
            <p className="text-xs text-slate-400">
              Claude AI가 리뷰를 분석하여 요약, 맞춤 추천, 체감 스탯을 제공
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-5">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-sm mb-1">맞춤 추천</h3>
            <p className="text-xs text-slate-400">
              &quot;저티어 유저에게 강추&quot;, &quot;드리블러에게 비추&quot; 등
              유저 유형별 맞춤 추천
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
