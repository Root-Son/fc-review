export interface Player {
  spid: number;
  player_id: number;
  season_id: number;
  name: string;
  season_name: string | null;
  position: string | null;
  ovr: number | null;
  image_url: string | null;
}

export interface Review {
  id: number;
  spid: number;
  source: "official" | "inven" | "fionbook";
  author: string | null;
  content: string;
  rating: number | null;
  source_url: string | null;
  source_date: string | null;
  crawled_at: string;
}

export interface AiSummary {
  spid: number;
  summary: string;
  pros: string[];
  cons: string[];
  recommendations: Recommendation[];
  review_count: number;
}

export interface Recommendation {
  target: string; // "저티어 유저", "드리블러", etc.
  level: "strong_recommend" | "recommend" | "neutral" | "not_recommend";
  reason: string;
}

export interface FeelStats {
  spid: number;
  shooting_feel: number;
  physical_feel: number;
  pass_accuracy_feel: number;
  weak_foot_feel: number;
  skill_move_feel: number;
  overall_feel: number;
  review_count: number;
}

export const FEEL_STAT_LABELS: Record<string, string> = {
  shooting_feel: "슈팅 체감",
  physical_feel: "피지컬/버티기",
  pass_accuracy_feel: "패스 정확도",
  weak_foot_feel: "약발 체감",
  skill_move_feel: "스킬무브/역동작",
  overall_feel: "종합 체감",
};

export const SOURCE_LABELS: Record<string, string> = {
  official: "공식 홈페이지",
  inven: "인벤",
  fionbook: "피온북",
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_recommend: "강력 추천",
  recommend: "추천",
  neutral: "보통",
  not_recommend: "비추천",
};
