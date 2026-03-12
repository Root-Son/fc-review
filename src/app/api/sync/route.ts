import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { fetchAllPlayers, fetchSeasons, getPlayerImageUrl } from "@/lib/nexon-api";

// POST: Nexon 메타데이터를 Supabase에 동기화
export async function POST() {
  const db = getServiceSupabase();

  try {
    // 1. 시즌 메타데이터 가져오기
    const seasons = await fetchSeasons();
    const seasonMap = new Map(seasons.map((s) => [s.seasonId, s.className]));

    // 2. 선수 메타데이터 가져오기
    const players = await fetchAllPlayers();

    // 3. 배치로 Supabase에 저장 (1000개씩)
    const batchSize = 1000;
    let total = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize).map((p) => {
        const seasonId = Math.floor(p.id / 1000000);
        return {
          spid: p.id,
          player_id: p.id % 1000000,
          season_id: seasonId,
          name: p.name,
          season_name: seasonMap.get(seasonId) || null,
          image_url: getPlayerImageUrl(p.id),
        };
      });

      const { error } = await db
        .from("players")
        .upsert(batch, { onConflict: "spid", ignoreDuplicates: false });

      if (error) {
        console.error(`Batch ${i} error:`, error);
      } else {
        total += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      synced: total,
      seasons: seasons.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
