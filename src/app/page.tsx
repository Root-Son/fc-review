"use client";

import { useState, useEffect, useMemo } from "react";
import PlayerCard from "@/components/PlayerCard";
import type { Player } from "@/lib/types";

type AnalyzedPlayer = Player & { review_count: number; summary_preview: string };

const POSITION_FILTERS = [
  { label: "전체", value: "" },
  { label: "ST", value: "ST" },
  { label: "CF", value: "CF" },
  { label: "LW", value: "LW" },
  { label: "RW", value: "RW" },
  { label: "CAM", value: "CAM" },
  { label: "CM", value: "CM" },
  { label: "CDM", value: "CDM" },
  { label: "LB", value: "LB" },
  { label: "RB", value: "RB" },
  { label: "CB", value: "CB" },
  { label: "GK", value: "GK" },
];

export default function HomePage() {
  const [players, setPlayers] = useState<AnalyzedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    try {
      const res = await fetch("/api/players/analyzed");
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = players;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (position) {
      list = list.filter((p) => p.position === position);
    }
    return list;
  }, [players, query, position]);

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-10">
        <h1 className="text-3xl font-black mb-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            FC Online
          </span>{" "}
          선수 리뷰
        </h1>
        <p className="text-slate-400 text-sm">
          AI가 분석한 체감 스탯과 맞춤 추천을 확인하세요
        </p>
      </div>

      {/* 필터 바 */}
      <div className="max-w-4xl mx-auto mb-6 space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="선수 이름으로 검색..."
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <div className="flex flex-wrap gap-1.5">
          {POSITION_FILTERS.map((pf) => (
            <button
              key={pf.value}
              onClick={() => setPosition(pf.value === position ? "" : pf.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                position === pf.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 선수 목록 */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-3">선수 목록을 불러오는 중...</p>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-xs text-slate-500 mb-3">
              {filtered.length}명의 선수
              {query || position ? " (필터 적용됨)" : ""}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((player) => (
                <PlayerCard key={player.spid} player={player} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-1">
              {query || position
                ? "검색 결과가 없습니다"
                : "분석된 선수가 없습니다"}
            </p>
            <p className="text-sm text-slate-600">
              {query || position
                ? "다른 조건으로 검색해보세요"
                : "리뷰 데이터가 수집되면 여기에 표시됩니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
