-- FC Review Supabase Schema

-- 선수 메타데이터
CREATE TABLE players (
  spid INTEGER PRIMARY KEY,          -- 시즌ID(3) + 선수ID(6)
  player_id INTEGER NOT NULL,        -- 순수 선수 ID
  season_id INTEGER NOT NULL,        -- 시즌 ID
  name TEXT NOT NULL,                 -- 선수 이름
  season_name TEXT,                   -- 시즌 이름 (ICON, TOTY 등)
  position TEXT,                      -- 주 포지션
  ovr INTEGER,                        -- 오버롤
  image_url TEXT,                     -- 선수 이미지 URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_name ON players USING gin(to_tsvector('simple', name));
CREATE INDEX idx_players_season ON players (season_id);
CREATE INDEX idx_players_ovr ON players (ovr DESC);

-- 크롤링된 리뷰
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  spid INTEGER REFERENCES players(spid),
  source TEXT NOT NULL,               -- 'official', 'inven', 'fionbook'
  author TEXT,                        -- 작성자
  content TEXT NOT NULL,              -- 리뷰 내용
  rating SMALLINT,                    -- 원본 평점 (있는 경우)
  source_url TEXT,                    -- 원본 URL
  source_date TIMESTAMPTZ,           -- 원본 작성일
  crawled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_spid ON reviews (spid);
CREATE INDEX idx_reviews_source ON reviews (source);

-- AI 요약 및 추천
CREATE TABLE ai_summaries (
  id BIGSERIAL PRIMARY KEY,
  spid INTEGER REFERENCES players(spid) UNIQUE,
  summary TEXT,                       -- AI 리뷰 요약
  pros TEXT[],                        -- 장점 리스트
  cons TEXT[],                        -- 단점 리스트
  recommendations JSONB,             -- 맞춤형 추천 [{target, level, reason}]
  review_count INTEGER DEFAULT 0,    -- 요약에 사용된 리뷰 수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 체감 스탯 (육각형 차트)
CREATE TABLE feel_stats (
  id BIGSERIAL PRIMARY KEY,
  spid INTEGER REFERENCES players(spid) UNIQUE,
  shooting_feel NUMERIC(3,1),        -- 슈팅 체감
  physical_feel NUMERIC(3,1),        -- 피지컬/버티기 체감
  pass_accuracy_feel NUMERIC(3,1),   -- 패스 정확도 체감
  weak_foot_feel NUMERIC(3,1),       -- 약발 체감
  skill_move_feel NUMERIC(3,1),      -- 역동작/스킬무브 체감
  overall_feel NUMERIC(3,1),         -- 종합 체감
  review_count INTEGER DEFAULT 0,    -- 분석에 사용된 리뷰 수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feel_stats ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 공개 접근
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read ai_summaries" ON ai_summaries FOR SELECT USING (true);
CREATE POLICY "Public read feel_stats" ON feel_stats FOR SELECT USING (true);

-- service_role만 쓰기 허용 (API routes에서 사용)
CREATE POLICY "Service write players" ON players FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write ai_summaries" ON ai_summaries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write feel_stats" ON feel_stats FOR ALL USING (auth.role() = 'service_role');
