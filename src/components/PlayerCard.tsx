"use client";

import Link from "next/link";
import Image from "next/image";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/player/${player.spid}`}
      className="group flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 hover:bg-slate-700/60 hover:border-blue-500/30 transition-all"
    >
      {player.image_url && (
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700 shrink-0">
          <Image
            src={player.image_url}
            alt={player.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {player.season_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium shrink-0">
              {player.season_name}
            </span>
          )}
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
        </div>
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
