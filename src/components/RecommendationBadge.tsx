"use client";

import type { Recommendation } from "@/lib/types";
import { RECOMMENDATION_LABELS } from "@/lib/types";

const levelColors: Record<string, string> = {
  strong_recommend:
    "bg-green-500/20 text-green-400 border-green-500/40",
  recommend: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  neutral: "bg-slate-500/20 text-slate-400 border-slate-500/40",
  not_recommend: "bg-red-500/20 text-red-400 border-red-500/40",
};

const levelIcons: Record<string, string> = {
  strong_recommend: "🔥",
  recommend: "👍",
  neutral: "➖",
  not_recommend: "👎",
};

export default function RecommendationBadge({
  rec,
}: {
  rec: Recommendation;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${levelColors[rec.level]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{levelIcons[rec.level]}</span>
        <span className="font-semibold text-sm">
          {rec.target}
        </span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-black/20">
          {RECOMMENDATION_LABELS[rec.level]}
        </span>
      </div>
      <p className="text-xs opacity-80 mt-1">{rec.reason}</p>
    </div>
  );
}
