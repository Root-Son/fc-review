/**
 * FC Online 리뷰 크롤러
 * 1) 인벤 선수평가 페이지 (1000페이지+)
 * 2) 유튜브 선수 리뷰 자막
 */

import { YoutubeTranscript } from "youtube-transcript";

export interface CrawledReview {
  source: "inven" | "youtube";
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

// ===== 인벤 크롤러 =====

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

      const nameMatch = block.match(
        /<span class="fifa4 name">[\s\S]*?<\/img>\s*([^<]+)|<span class="fifa4 name">[^<]*(?:<[^>]*>[^<]*)*\s+([^<\s][^<]*)/
      );
      let name = "";
      if (nameMatch) {
        name = (nameMatch[1] || nameMatch[2] || "").trim();
      }
      if (!name) {
        const simpleNameMatch = block.match(
          /class="fifa4 name">[^]*?(?:alt="[^"]*"\s*\/?>|<\/img>)\s*\n?\s*([^\n<]+)/
        );
        if (simpleNameMatch) name = simpleNameMatch[1].trim();
      }

      infos.push({ code, name, comment });
    }

    const authorPattern =
      /<td[^>]*class="text_right"[^>]*>([\s\S]*?)<\/td>/gi;
    const authors: { author: string; date: string }[] = [];
    let authorMatch;
    while ((authorMatch = authorPattern.exec(html)) !== null) {
      const block = authorMatch[1];

      const authorNameMatch = block.match(
        /alt="Lv\d+"[^>]*\/?>\s*([^<]+)/
      );
      const author = authorNameMatch ? authorNameMatch[1].trim() : "";

      const dateMatch = block.match(
        /<span class="fifa4">\s*(\d{4}\.\d{2}\.\d{2}[^<]*)<\/span>/
      );
      const date = dateMatch ? dateMatch[1].trim() : "";

      authors.push({ author, date });
    }

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

// 배치 크롤링: 인벤 리뷰 N페이지 수집 (startPage부터)
export async function crawlInvenBatch(
  totalPages: number = 5,
  startPage: number = 1
): Promise<CrawledReview[]> {
  const all: CrawledReview[] = [];
  for (let pg = startPage; pg < startPage + totalPages; pg++) {
    const reviews = await crawlInvenPage(pg);
    all.push(...reviews);
    await new Promise((r) => setTimeout(r, 300));
  }
  return all;
}

// ===== 유튜브 크롤러 =====

// 유튜브 검색으로 FC온라인 선수 리뷰 영상 찾기
async function searchYoutubeVideos(
  query: string,
  maxResults: number = 5
): Promise<{ videoId: string; title: string; channelTitle: string }[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const html = await res.text();

  const results: { videoId: string; title: string; channelTitle: string }[] = [];

  // ytInitialData에서 비디오 정보 추출
  const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  if (!dataMatch) return [];

  try {
    const data = JSON.parse(dataMatch[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    for (const item of contents) {
      const renderer = item?.videoRenderer;
      if (!renderer) continue;
      results.push({
        videoId: renderer.videoId,
        title: renderer.title?.runs?.[0]?.text || "",
        channelTitle: renderer.ownerText?.runs?.[0]?.text || "",
      });
      if (results.length >= maxResults) break;
    }
  } catch {
    // JSON 파싱 실패 시 regex 폴백
    const videoPattern = /\/watch\?v=([\w-]{11})/g;
    const seen = new Set<string>();
    let m;
    while ((m = videoPattern.exec(html)) !== null && results.length < maxResults) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        results.push({ videoId: m[1], title: "", channelTitle: "" });
      }
    }
  }

  return results;
}

// 유튜브 영상 자막 가져오기
async function getYoutubeTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ko",
    });
    if (!transcript || transcript.length === 0) return null;
    return transcript.map((t) => t.text).join(" ");
  } catch {
    // 한국어 자막 없으면 기본 자막 시도
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcript || transcript.length === 0) return null;
      return transcript.map((t) => t.text).join(" ");
    } catch {
      return null;
    }
  }
}

// 특정 선수의 유튜브 리뷰 크롤링
export async function crawlYoutubeByPlayer(
  playerName: string,
  seasonName?: string,
  maxVideos: number = 3
): Promise<CrawledReview[]> {
  const reviews: CrawledReview[] = [];
  const searchQuery = `FC온라인 ${seasonName ? seasonName.split("(")[0].trim() + " " : ""}${playerName} 리뷰`;

  try {
    const videos = await searchYoutubeVideos(searchQuery, maxVideos);

    for (const video of videos) {
      const transcript = await getYoutubeTranscript(video.videoId);
      if (!transcript || transcript.length < 50) continue;

      // 자막이 너무 길면 앞부분만 사용 (AI가 처리할 수 있는 범위)
      const content = transcript.length > 3000
        ? transcript.slice(0, 3000) + "..."
        : transcript;

      reviews.push({
        source: "youtube",
        spid: null,
        playerName,
        author: video.channelTitle || null,
        content,
        rating: null,
        source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        source_date: null,
      });

      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (e) {
    console.error(`[Crawler] 유튜브 크롤링 실패 (${playerName}):`, e);
  }

  return reviews;
}

// 유튜브 배치 크롤링: 인기 FC온라인 리뷰 영상들
export async function crawlYoutubeBatch(
  maxVideos: number = 10
): Promise<CrawledReview[]> {
  const reviews: CrawledReview[] = [];
  const queries = [
    "FC온라인 선수 리뷰 2026",
    "FC온라인 TOTY 리뷰",
    "FC온라인 아이콘 리뷰",
    "피파온라인4 선수 추천",
    "FC온라인 선수 체감 리뷰",
  ];

  for (const query of queries) {
    try {
      const videos = await searchYoutubeVideos(query, Math.ceil(maxVideos / queries.length));
      for (const video of videos) {
        const transcript = await getYoutubeTranscript(video.videoId);
        if (!transcript || transcript.length < 100) continue;

        const content = transcript.length > 3000
          ? transcript.slice(0, 3000) + "..."
          : transcript;

        reviews.push({
          source: "youtube",
          spid: null,
          playerName: null,
          author: video.channelTitle || null,
          content: `[${video.title}] ${content}`,
          rating: null,
          source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
          source_date: null,
        });
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`[Crawler] 유튜브 배치 크롤링 실패 (${query}):`, e);
    }
  }

  return reviews;
}
