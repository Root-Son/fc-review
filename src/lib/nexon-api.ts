const BASE_URL = "https://open.api.nexon.com/fconline/v1";

async function nexonFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-nxopen-api-key": process.env.NEXON_API_KEY! },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Nexon API error: ${res.status} ${path}`);
  return res.json();
}

export interface SpidMeta {
  id: number;
  name: string;
}

export interface SeasonMeta {
  seasonId: number;
  className: string;
  seasonImg: string;
}

// 메타데이터
export async function fetchAllPlayers(): Promise<SpidMeta[]> {
  return nexonFetch("/metadata/spid");
}

export async function fetchSeasons(): Promise<SeasonMeta[]> {
  return nexonFetch("/metadata/seasonid");
}

export async function fetchPositions(): Promise<
  { spposition: number; desc: string }[]
> {
  return nexonFetch("/metadata/spposition");
}

// 선수 이미지 URL
export function getPlayerImageUrl(spid: number): string {
  return `https://open.api.nexon.com/static/fconline/PlayerImg/${spid}.png`;
}

// 시즌 아이콘 URL
export function getSeasonImageUrl(seasonId: number): string {
  return `https://open.api.nexon.com/static/fconline/SeasonImg/${seasonId}.png`;
}

// 랭커 스탯 조회
export interface RankerStatus {
  spId: number;
  status: Record<string, number>;
}

export async function fetchRankerStatus(
  spid: number,
  matchType: number = 50
): Promise<RankerStatus[]> {
  return nexonFetch(`/ranker/status?matchtype=${matchType}&players=${spid}`);
}

// 유저 매치 상세 (선수별 퍼포먼스 데이터 포함)
export async function fetchMatchDetail(matchId: string) {
  return nexonFetch(`/match-detail?matchid=${matchId}`);
}

// 유저 OUID 조회
export async function fetchUserOuid(
  nickname: string
): Promise<{ ouid: string }> {
  return nexonFetch(`/id?nickname=${encodeURIComponent(nickname)}`);
}

// 유저 매치 목록
export async function fetchUserMatches(
  ouid: string,
  matchType: number = 50,
  offset: number = 0,
  limit: number = 20
): Promise<string[]> {
  return nexonFetch(
    `/user/match?ouid=${ouid}&matchtype=${matchType}&offset=${offset}&limit=${limit}`
  );
}
