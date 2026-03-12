"use client";

import type { Review } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

const sourceColors: Record<string, string> = {
  official: "bg-emerald-500/20 text-emerald-400",
  inven: "bg-orange-500/20 text-orange-400",
  fionbook: "bg-purple-500/20 text-purple-400",
};

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceColors[review.source]}`}
        >
          {SOURCE_LABELS[review.source]}
        </span>
        {review.author && (
          <span className="text-xs text-slate-500">{review.author}</span>
        )}
        {review.rating && (
          <span className="ml-auto text-xs text-yellow-400">
            ★ {review.rating}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        {review.content}
      </p>
      {review.source_date && (
        <p className="text-[10px] text-slate-600 mt-2">
          {review.source_date}
        </p>
      )}
    </div>
  );
}
