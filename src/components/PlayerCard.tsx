"use client";

import Link from "next/link";
import Image from "next/image";
import type { Player } from "@/lib/types";

interface PlayerCardProps {
  player: Player & { review_count?: number; summary_preview?: string; season_img?: string | null };
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const imgUrl = `https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/playersAction/p${player.spid}.png`;

  return (
    <Link
      href={`/player/${player.spid}`}
      className="group flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 hover:bg-slate-700/60 hover:border-blue-500/30 transition-all"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700/50 shrink-0">
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {player.season_img ? (
            <img
              src={player.season_img}
              alt={player.season_name || ""}
              className="h-4 w-auto shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : player.season_name ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold shrink-0">
              {player.season_name.split(" ")[0]}
            </span>
          ) : null}
          <span className="font-semibold text-white truncate text-sm">
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          {player.position && <span>{player.position}</span>}
          {player.ovr && (
            <span className="text-yellow-400 font-medium">
              OVR {player.ovr}
            </span>
          )}
          {player.review_count != null && player.review_count > 0 && (
            <span className="text-blue-400">
              리뷰 {player.review_count}
            </span>
          )}
        </div>
        {player.summary_preview && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {player.summary_preview}...
          </p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
