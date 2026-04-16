-- ============================================================
-- 명당지도 (明堂地圖) — Supabase Schema Migration v1
-- ============================================================

-- extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. places (명당 장소)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  address         TEXT        NOT NULL,
  lat             FLOAT8      NOT NULL,
  lng             FLOAT8      NOT NULL,
  -- 오행 & 운
  ohaeng          TEXT[]      NOT NULL DEFAULT '{}',   -- ['화','토']
  luck_types      TEXT[]      NOT NULL DEFAULT '{}',   -- ['사업운','금전운']
  place_type      TEXT        NOT NULL DEFAULT 'etc'
                  CHECK (place_type IN ('산','사찰','호텔','공원','문화재','해변','강','도심','etc')),
  -- 콘텐츠
  description_short TEXT      NOT NULL DEFAULT '',     -- 마커 툴팁 50자
  reason_text     TEXT        NOT NULL DEFAULT '',     -- 풍수 근거 상세 500자
  -- 신뢰도
  expert_verified BOOLEAN     NOT NULL DEFAULT false,
  trust_score     SMALLINT    NOT NULL DEFAULT 50
                  CHECK (trust_score BETWEEN 0 AND 100),
  -- 미디어
  image_urls      TEXT[]      NOT NULL DEFAULT '{}',
  kakaomap_url    TEXT        NOT NULL DEFAULT '',
  source_sns      TEXT[]      NOT NULL DEFAULT '{}',
  -- 트렌딩
  trending_score  INTEGER     NOT NULL DEFAULT 0,
  -- 메타
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_ohaeng        ON places USING gin(ohaeng);
CREATE INDEX idx_places_luck_types    ON places USING gin(luck_types);
CREATE INDEX idx_places_trust_score   ON places (trust_score DESC);
CREATE INDEX idx_places_trending      ON places (trending_score DESC);
CREATE INDEX idx_places_location      ON places (lat, lng);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- 2. user_profiles (사용자 프로필 + 사주)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id        TEXT        UNIQUE,
  -- 생년월일시
  birth_year      SMALLINT,
  birth_month     SMALLINT    CHECK (birth_month BETWEEN 1 AND 12),
  birth_day       SMALLINT    CHECK (birth_day   BETWEEN 1 AND 31),
  birth_hour      SMALLINT    CHECK (birth_hour  BETWEEN 0 AND 23),
  gender          TEXT        CHECK (gender IN ('male','female')),
  -- 사주 분석 결과 (calculateSaju 반환값 캐시)
  ohaeng_analysis JSONB       NOT NULL DEFAULT '{}',
  -- {'목':2,'화':0,'토':1,'금':3,'수':2}
  weak_ohaeng     TEXT[]      NOT NULL DEFAULT '{}',
  strong_ohaeng   TEXT[]      NOT NULL DEFAULT '{}',
  imbalance_score SMALLINT    DEFAULT 0,
  -- 활동
  bookmarks       UUID[]      NOT NULL DEFAULT '{}',
  visited         JSONB       NOT NULL DEFAULT '[]',
  -- 메타
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- 3. place_contents (SNS 큐레이션 콘텐츠)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS place_contents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  sns_type        TEXT        NOT NULL
                  CHECK (sns_type IN ('인스타','유튜브','블로그','스레드','뉴스')),
  sns_url         TEXT        NOT NULL,
  sns_thumbnail   TEXT,
  sns_author      TEXT,
  snippet_text    TEXT,           -- 저작권 준수 50자 발췌
  collected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_place_contents_place ON place_contents (place_id);

-- ─────────────────────────────────────────────
-- 4. Row Level Security (RLS)
-- ─────────────────────────────────────────────

-- places: 전체 공개 읽기, 어드민만 쓰기
ALTER TABLE places        ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;

-- places 읽기: 누구나
CREATE POLICY "places_select_public"
  ON places FOR SELECT USING (true);

-- place_contents 읽기: 누구나
CREATE POLICY "place_contents_select_public"
  ON place_contents FOR SELECT USING (true);

-- user_profiles: 본인만 CRUD
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (auth.uid()::text = kakao_id OR kakao_id IS NULL);

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = kakao_id OR kakao_id IS NULL);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid()::text = kakao_id);

-- ─────────────────────────────────────────────
-- 5. 편의 뷰 — 장소 + 콘텐츠 수 조인
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW places_with_content_count AS
SELECT
  p.*,
  COUNT(pc.id)::INT AS content_count
FROM places p
LEFT JOIN place_contents pc ON pc.place_id = p.id
GROUP BY p.id;
