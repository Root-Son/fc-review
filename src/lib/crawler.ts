/**
 * FC Online 리뷰 크롤러
 * 인벤 리뷰 페이지에서 선수 리뷰를 수집
 * (공홈은 Cloudflare 보호로 서버사이드 크롤링 불가)
 */

export interface CrawledReview {
  source: "inven";
  spid: number | null;
  playerName: string | null;
  author: string | null;
  content: string;
  rating: number | null;
  source_url: string;
  source_date: string | null;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 인벤 리뷰 페이지 크롤링 (전체 - 페이지별)
export async function crawlInvenPage(
  page: number = 1
): Promise<CrawledReview[]> {
  const url = `https://fconline.inven.co.kr/dataninfo/rate/index.php?pg=${page}`;
  return parseInvenPage(url);
}

// 인벤 특정 선수 리뷰 검색
export async function crawlInvenByPlayer(
  playerName: string,
  pages: number = 3
): Promise<CrawledReview[]> {
  const all: CrawledReview[] = [];
  for (let pg = 1; pg <= pages; pg++) {
    const url = `https://fconline.inven.co.kr/dataninfo/rate/index.php?searchword=${encodeURIComponent(playerName)}&pg=${pg}`;
    const reviews = await parseInvenPage(url);
    all.push(...reviews);
    if (reviews.length < 15) break; // 더 이상 결과 없음
  }
  return all;
}

async function parseInvenPage(url: string): Promise<CrawledReview[]> {
  const reviews: CrawledReview[] = [];

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // 각 리뷰 행에서 comment만 추출 (가장 안정적인 패턴)
    // 전체 테이블 행: <tr>...<a href="../player/?code=XXX" class="... rate_info ...">...<span class="fifa4 comment">TEXT</span>...</a>...<td class="text_right">AUTHOR_INFO</td>...</tr>
    // 2단계 파싱: 먼저 rate_info 블록을 찾고, 그 다음 author 블록을 찾음

    // Step 1: rate_info 블록에서 code + name + comment 추출
    const infoPattern =
      /<a[^>]*href="\.\.\/player\/\?code=(\d+)"[^>]*class="[^"]*rate_info[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

    const infos: { code: string; name: string; comment: string }[] = [];
    let infoMatch;
    while ((infoMatch = infoPattern.exec(html)) !== null) {
      const code = infoMatch[1];
      const block = infoMatch[2];

      const commentMatch = block.match(
        /<span class="fifa4 comment">([\s\S]*?)<\/span>/
      );
      const comment = commentMatch
        ? commentMatch[1].replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").trim()
        : "";

      // 선수 이름 추출
      const nameMatch = block.match(
        /<span class="fifa4 name">[\s\S]*?<\/img>\s*([^<]+)|<span class="fifa4 name">[^<]*(?:<[^>]*>[^<]*)*\s+([^<\s][^<]*)/
      );
      let name = "";
      if (nameMatch) {
        name = (nameMatch[1] || nameMatch[2] || "").trim();
      }
      // 더 간단한 이름 추출 시도
      if (!name) {
        const simpleNameMatch = block.match(
          /class="fifa4 name">[^]*?(?:alt="[^"]*"\s*\/?>|<\/img>)\s*\n?\s*([^\n<]+)/
        );
        if (simpleNameMatch) name = simpleNameMatch[1].trim();
      }

      infos.push({ code, name, comment });
    }

    // Step 2: author 블록에서 작성자명 + 날짜 추출
    const authorPattern =
      /<td[^>]*class="text_right"[^>]*>([\s\S]*?)<\/td>/gi;
    const authors: { author: string; date: string }[] = [];
    let authorMatch;
    while ((authorMatch = authorPattern.exec(html)) !== null) {
      const block = authorMatch[1];

      // 작성자: <img ... alt="LvN" /> 작성자명
      const authorNameMatch = block.match(
        /alt="Lv\d+"[^>]*\/?>\s*([^<]+)/
      );
      const author = authorNameMatch ? authorNameMatch[1].trim() : "";

      // 날짜
      const dateMatch = block.match(
        /<span class="fifa4">\s*(\d{4}\.\d{2}\.\d{2}[^<]*)<\/span>/
      );
      const date = dateMatch ? dateMatch[1].trim() : "";

      authors.push({ author, date });
    }

    // 매칭
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const auth = authors[i] || { author: "", date: "" };

      if (info.comment.length > 2) {
        reviews.push({
          source: "inven",
          spid: parseInt(info.code) || null,
          playerName: info.name || null,
          author: auth.author || null,
          content: info.comment,
          rating: null,
          source_url: `https://fconline.inven.co.kr/dataninfo/player/?code=${info.code}`,
          source_date: auth.date || null,
        });
      }
    }
  } catch (e) {
    console.error(`[Crawler] 인벤 크롤링 실패:`, e);
  }

  return reviews;
}

// 배치 크롤링: 인벤 최신 리뷰 N페이지 수집
export async function crawlInvenBatch(
  totalPages: number = 10
): Promise<CrawledReview[]> {
  const all: CrawledReview[] = [];
  for (let pg = 1; pg <= totalPages; pg++) {
    const reviews = await crawlInvenPage(pg);
    all.push(...reviews);
    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }
  return all;
}
