/**
 * FC Online 리뷰 크롤러
 * 공홈 AJAX 댓글 API + 인벤 리뷰 페이지에서 수집
 */

export interface CrawledReview {
  source: "official" | "inven";
  author: string | null;
  content: string;
  rating: number | null;
  source_url: string;
  source_date: string | null;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ====== 공홈 크롤링 (AJAX 댓글 API) ======
export async function crawlOfficialReviews(
  spid: number
): Promise<CrawledReview[]> {
  const pageUrl = `https://fconline.nexon.com/DataCenter/PlayerInfo?spid=${spid}&n1Strong=1`;
  const reviews: CrawledReview[] = [];

  try {
    // 1단계: PlayerInfo 페이지에서 n4ArticleSN 추출
    const pageRes = await fetch(pageUrl, {
      headers: { "User-Agent": UA },
    });
    if (!pageRes.ok) return [];
    const pageHtml = await pageRes.text();

    // Article.PlayerCommentList(1, "#divCommentList", "12345", 0) 에서 ArticleSN 추출
    const snMatch = pageHtml.match(
      /PlayerCommentList\(\s*\d+\s*,\s*"[^"]*"\s*,\s*"(\d+)"/
    );
    if (!snMatch) return [];
    const articleSN = snMatch[1];

    // 2단계: 댓글 API 호출 (1~3페이지)
    for (let page = 1; page <= 3; page++) {
      try {
        const commentRes = await fetch(
          `https://fconline.nexon.com/Community/PlayerAssessment/CommentList?n4CommentPageNo=${page}&n4ArticleSN=${articleSN}&n1codeOrderingType=0`,
          {
            headers: {
              "User-Agent": UA,
              "X-Requested-With": "XMLHttpRequest",
              Referer: pageUrl,
            },
          }
        );
        if (!commentRes.ok) break;
        const commentHtml = await commentRes.text();

        // 댓글 파싱: <span class="txt"><span class="icon_score">평점 N</span> 댓글내용</span>
        const commentPattern =
          /<li[^>]*data-no="([^"]*)"[\s\S]*?<span class="date">([\s\S]*?)<\/span>[\s\S]*?<span class="txt">([\s\S]*?)<\/span>/gi;
        let match;
        while ((match = commentPattern.exec(commentHtml)) !== null) {
          const author = match[1].trim();
          const date = match[2].trim();
          let textBlock = match[3];

          // 평점 추출
          let rating: number | null = null;
          const ratingMatch = textBlock.match(/평점\s*(\d+)/);
          if (ratingMatch) {
            rating = parseInt(ratingMatch[1]);
          }

          // HTML 태그 제거하고 텍스트만 추출
          const content = textBlock
            .replace(/<[^>]+>/g, "")
            .replace(/평점\s*\d+/g, "")
            .trim();

          if (content.length > 2) {
            reviews.push({
              source: "official",
              author: author || null,
              content,
              rating,
              source_url: pageUrl,
              source_date: date || null,
            });
          }
        }

        // 더 이상 댓글이 없으면 중단
        if (!commentHtml.includes("btn_load_more")) break;
      } catch {
        break;
      }
    }
  } catch (e) {
    console.error(`[Crawler] 공홈 크롤링 실패: spid=${spid}`, e);
  }

  return reviews;
}

// ====== 인벤 크롤링 (리뷰 목록 페이지) ======
export async function crawlInvenReviews(
  spid: number
): Promise<CrawledReview[]> {
  const reviews: CrawledReview[] = [];
  const playerName = String(spid); // 검색용

  try {
    // 인벤 리뷰 목록 페이지 (최대 3페이지)
    for (let page = 1; page <= 3; page++) {
      const url = `https://fconline.inven.co.kr/dataninfo/rate/index.php?pg=${page}`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA },
        });
        if (!res.ok) break;
        const html = await res.text();

        // 각 리뷰 행 파싱
        // <a href="../player/?code=XXX" class="fifa4 rate_info clearfix">
        //   <span class="fifa4 comment">리뷰 텍스트</span>
        // 작성자와 날짜는 다음 <td> 안에 있음
        const rowPattern =
          /<a[^>]*href="\.\.\/player\/\?code=(\d+)"[^>]*class="[^"]*rate_info[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*class="text_right"[^>]*>([\s\S]*?)<\/td>/gi;

        let match;
        while ((match = rowPattern.exec(html)) !== null) {
          const code = match[1];
          const infoBlock = match[2];
          const authorBlock = match[3];

          // 선수 이름 추출
          const nameMatch = infoBlock.match(
            /<span class="fifa4 name">[^<]*<[^>]*>[^<]*<\/[^>]*>\s*([^<]+)/
          );

          // 리뷰 텍스트 추출
          const commentMatch = infoBlock.match(
            /<span class="fifa4 comment">([\s\S]*?)<\/span>/
          );
          const content = commentMatch
            ? commentMatch[1].replace(/<[^>]+>/g, "").trim()
            : "";

          // 작성자 추출
          const authorMatch = authorBlock.match(
            /(?:<img[^>]*\/>|<img[^>]*>)\s*([^<]+)/
          );
          const author = authorMatch ? authorMatch[1].trim() : null;

          // 날짜 추출
          const dateMatch = authorBlock.match(
            /<span class="fifa4">\s*(\d{4}\.\d{2}\.\d{2}[^<]*)<\/span>/
          );
          const date = dateMatch ? dateMatch[1].trim() : null;

          if (content.length > 2) {
            reviews.push({
              source: "inven",
              author,
              content,
              rating: null,
              source_url: `https://fconline.inven.co.kr/dataninfo/player/?code=${code}`,
              source_date: date,
            });
          }
        }
      } catch {
        break;
      }
    }
  } catch (e) {
    console.error(`[Crawler] 인벤 크롤링 실패: spid=${spid}`, e);
  }

  return reviews;
}

// 특정 선수의 인벤 리뷰 (선수 이름으로 필터 검색)
export async function crawlInvenPlayerReviews(
  spid: number,
  playerName: string
): Promise<CrawledReview[]> {
  const reviews: CrawledReview[] = [];

  try {
    const url = `https://fconline.inven.co.kr/dataninfo/rate/index.php?searchword=${encodeURIComponent(playerName)}&pg=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const rowPattern =
      /<a[^>]*href="\.\.\/player\/\?code=(\d+)"[^>]*class="[^"]*rate_info[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*class="text_right"[^>]*>([\s\S]*?)<\/td>/gi;

    let match;
    while ((match = rowPattern.exec(html)) !== null) {
      const infoBlock = match[2];
      const authorBlock = match[3];

      const commentMatch = infoBlock.match(
        /<span class="fifa4 comment">([\s\S]*?)<\/span>/
      );
      const content = commentMatch
        ? commentMatch[1].replace(/<[^>]+>/g, "").trim()
        : "";

      const authorMatch = authorBlock.match(
        /(?:<img[^>]*\/>|<img[^>]*>)\s*([^<]+)/
      );
      const author = authorMatch ? authorMatch[1].trim() : null;

      const dateMatch = authorBlock.match(
        /<span class="fifa4">\s*(\d{4}\.\d{2}\.\d{2}[^<]*)<\/span>/
      );
      const date = dateMatch ? dateMatch[1].trim() : null;

      if (content.length > 2) {
        reviews.push({
          source: "inven",
          author,
          content,
          rating: null,
          source_url: url,
          source_date: date,
        });
      }
    }
  } catch (e) {
    console.error(`[Crawler] 인벤 선수별 크롤링 실패: ${playerName}`, e);
  }

  return reviews;
}

// 모든 소스에서 크롤링
export async function crawlAllReviews(
  spid: number,
  playerName?: string
): Promise<CrawledReview[]> {
  const tasks: Promise<CrawledReview[]>[] = [
    crawlOfficialReviews(spid),
  ];

  if (playerName) {
    tasks.push(crawlInvenPlayerReviews(spid, playerName));
  } else {
    tasks.push(crawlInvenReviews(spid));
  }

  const results = await Promise.all(tasks);
  return results.flat();
}
