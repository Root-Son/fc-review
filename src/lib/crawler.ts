/**
 * FC Online 리뷰 크롤러
 * 공홈 데이터센터와 인벤에서 선수 리뷰를 수집
 */

export interface CrawledReview {
  source: "official" | "inven";
  author: string | null;
  content: string;
  rating: number | null;
  source_url: string;
  source_date: string | null;
}

// ====== 공홈 데이터센터 크롤링 ======
// 공홈 선수 상세 페이지에서 유저 평가/코멘트 추출
export async function crawlOfficialReviews(
  spid: number
): Promise<CrawledReview[]> {
  const url = `https://fconline.nexon.com/DataCenter/PlayerInfo?spid=${spid}&n1Strong=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseOfficialReviews(html, url);
  } catch {
    console.error(`[Crawler] 공홈 크롤링 실패: spid=${spid}`);
    return [];
  }
}

function parseOfficialReviews(html: string, url: string): CrawledReview[] {
  const reviews: CrawledReview[] = [];

  // 공홈 유저 한줄평 파싱 (data_comment 영역)
  const commentPattern =
    /<div[^>]*class="[^"]*comment_area[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = commentPattern.exec(html)) !== null) {
    const block = match[1];
    const authorMatch = block.match(
      /<span[^>]*class="[^"]*nick[^"]*"[^>]*>([^<]+)<\/span>/
    );
    const contentMatch = block.match(
      /<p[^>]*class="[^"]*txt[^"]*"[^>]*>([^<]+)<\/p>/
    );
    if (contentMatch) {
      reviews.push({
        source: "official",
        author: authorMatch?.[1]?.trim() || null,
        content: contentMatch[1].trim(),
        rating: null,
        source_url: url,
        source_date: null,
      });
    }
  }

  // 공홈 선수 추천/비추천 등의 텍스트도 파싱
  const recPattern =
    /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = recPattern.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 5) {
      reviews.push({
        source: "official",
        author: null,
        content: text,
        rating: null,
        source_url: url,
        source_date: null,
      });
    }
  }

  return reviews;
}

// ====== 인벤 크롤링 ======
export async function crawlInvenReviews(
  spid: number
): Promise<CrawledReview[]> {
  const url = `https://fconline.inven.co.kr/dataninfo/player/?code=${spid}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseInvenReviews(html, url);
  } catch {
    console.error(`[Crawler] 인벤 크롤링 실패: spid=${spid}`);
    return [];
  }
}

function parseInvenReviews(html: string, url: string): CrawledReview[] {
  const reviews: CrawledReview[] = [];

  // 인벤 리뷰/평가 영역 파싱
  const reviewPattern =
    /<div[^>]*class="[^"]*user_review[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = reviewPattern.exec(html)) !== null) {
    const block = match[1];
    const authorMatch = block.match(
      /<span[^>]*class="[^"]*writer[^"]*"[^>]*>([^<]+)<\/span>/
    );
    const contentMatch = block.match(
      /<p[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/p>/
    );
    const ratingMatch = block.match(
      /<span[^>]*class="[^"]*score[^"]*"[^>]*>(\d+)<\/span>/
    );
    const dateMatch = block.match(
      /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/
    );

    if (contentMatch) {
      reviews.push({
        source: "inven",
        author: authorMatch?.[1]?.trim() || null,
        content: contentMatch[1].replace(/<[^>]+>/g, "").trim(),
        rating: ratingMatch ? parseInt(ratingMatch[1]) : null,
        source_url: url,
        source_date: dateMatch?.[1]?.trim() || null,
      });
    }
  }

  // 인벤 한줄 코멘트 영역
  const shortPattern =
    /<li[^>]*class="[^"]*rate_comment[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  while ((match = shortPattern.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 3) {
      reviews.push({
        source: "inven",
        author: null,
        content: text,
        rating: null,
        source_url: url,
        source_date: null,
      });
    }
  }

  return reviews;
}

// 모든 소스에서 크롤링
export async function crawlAllReviews(
  spid: number
): Promise<CrawledReview[]> {
  const [official, inven] = await Promise.all([
    crawlOfficialReviews(spid),
    crawlInvenReviews(spid),
  ]);
  return [...official, ...inven];
}
