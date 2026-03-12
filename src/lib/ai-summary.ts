import Anthropic from "@anthropic-ai/sdk";
import type { Review, Recommendation, FeelStats } from "./types";

const anthropic = new Anthropic();

interface AiAnalysisResult {
  summary: string;
  pros: string[];
  cons: string[];
  recommendations: Recommendation[];
  feelStats: {
    shooting_feel: number;
    physical_feel: number;
    pass_accuracy_feel: number;
    weak_foot_feel: number;
    skill_move_feel: number;
    overall_feel: number;
  };
}

export async function analyzeReviews(
  playerName: string,
  seasonName: string,
  reviews: Review[]
): Promise<AiAnalysisResult> {
  const reviewTexts = reviews
    .map(
      (r, i) =>
        `[리뷰 ${i + 1} - ${r.source}] ${r.content}${r.rating ? ` (평점: ${r.rating})` : ""}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `당신은 FC Online(축구 게임) 선수 카드 전문 분석가입니다.
아래는 "${seasonName} ${playerName}" 선수 카드에 대한 유저 리뷰들입니다.

${reviewTexts}

위 리뷰들을 분석하여 아래 JSON 형식으로 응답해주세요. 반드시 유효한 JSON만 출력하세요.

{
  "summary": "3-4문장의 종합 리뷰 요약. 이 선수 카드의 핵심 특성과 체감을 설명",
  "pros": ["장점1", "장점2", "장점3"],
  "cons": ["단점1", "단점2"],
  "recommendations": [
    {
      "target": "대상 유저 유형 (예: 저티어 유저, 드리블 중심 유저, 초보자 등)",
      "level": "strong_recommend | recommend | neutral | not_recommend",
      "reason": "추천/비추천 이유"
    }
  ],
  "feelStats": {
    "shooting_feel": 0.0,
    "physical_feel": 0.0,
    "pass_accuracy_feel": 0.0,
    "weak_foot_feel": 0.0,
    "skill_move_feel": 0.0,
    "overall_feel": 0.0
  }
}

주의사항:
- recommendations는 3-5개, 다양한 유저 유형별로 작성
- feelStats는 1.0-10.0 사이 값 (리뷰에서 체감 정보를 추출)
- 스탯 수치와 체감이 다른 경우 반드시 반영 (예: 약발 4지만 체감 3)
- 리뷰가 부족한 항목은 5.0으로 설정
- level은 반드시 4가지 중 하나: strong_recommend, recommend, neutral, not_recommend`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // JSON 파싱 (마크다운 코드블록 제거)
  const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const result = JSON.parse(jsonStr);

  return {
    summary: result.summary,
    pros: result.pros,
    cons: result.cons,
    recommendations: result.recommendations,
    feelStats: result.feelStats,
  };
}
