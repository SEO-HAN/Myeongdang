-- ============================================================
-- 003_f_stage.sql — F단계 DB 확장
-- 카카오 OAuth 연동 + 북마크 배열 타입 안전 + 일진 캐시 테이블
-- ============================================================

-- ── user_profiles 컬럼 추가 ──────────────────────────────────

-- bookmarks를 UUID[] 대신 TEXT[]로 (place_id가 UUID지만 유연성)
-- 이미 TEXT[]로 되어 있으면 무시
DO $$
BEGIN
  -- kakao_nickname 추가 (소셜 로그인 표시명)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'kakao_nickname'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN kakao_nickname TEXT;
  END IF;

  -- avatar_url 추가 (카카오 프로필 이미지)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- last_login_at 추가 (DAU 집계용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_login_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- visited_place_count 추가 (방문 통계)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'visited_place_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN visited_place_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── 일진 캐시 테이블 (성능 최적화) ──────────────────────────

CREATE TABLE IF NOT EXISTS ilshin_cache (
  date        DATE        PRIMARY KEY,           -- YYYY-MM-DD
  day_pillar  JSONB       NOT NULL,              -- { cheongan, jiji, label, ... }
  today_ohaeng TEXT[]     NOT NULL,              -- ['목', '화']
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 30일 이상 된 캐시 자동 정리 (pg_cron 없을 경우 앱 레벨에서 처리)
COMMENT ON TABLE ilshin_cache IS '일진(日辰) 계산 결과 캐시 — 하루 1번 계산 후 재사용';

-- ── place_visits 테이블 (방문 추적) ────────────────────────

CREATE TABLE IF NOT EXISTS place_visits (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id    UUID        REFERENCES places(id) ON DELETE CASCADE,
  kakao_id    TEXT        REFERENCES user_profiles(kakao_id) ON DELETE SET NULL,
  visited_at  TIMESTAMPTZ DEFAULT NOW(),
  source      TEXT        -- 'map_click' | 'kakaomap_deeplink' | 'share'
);

CREATE INDEX IF NOT EXISTS idx_place_visits_place_id ON place_visits (place_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_kakao_id ON place_visits (kakao_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_visited_at ON place_visits (visited_at DESC);

-- ── RLS: place_visits ────────────────────────────────────────

ALTER TABLE place_visits ENABLE ROW LEVEL SECURITY;

-- 누구나 방문 기록 삽입 가능 (익명 포함)
CREATE POLICY "visits_insert_public"
  ON place_visits FOR INSERT
  TO public
  WITH CHECK (true);

-- 본인 방문 기록만 조회
CREATE POLICY "visits_select_own"
  ON place_visits FOR SELECT
  USING (kakao_id = auth.uid()::text OR kakao_id IS NULL);

-- ── RLS: ilshin_cache (공개 읽기, 서버만 쓰기) ───────────────

ALTER TABLE ilshin_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ilshin_select_public"
  ON ilshin_cache FOR SELECT
  TO public
  USING (true);

-- 쓰기는 서비스 롤만 (앱 서버에서만 캐시 저장)
-- anon은 쓸 수 없음 (service_role이 직접 접근)

-- ── trending_score 자동 업데이트 뷰 ─────────────────────────

-- 최근 7일 방문 수 기준 trending_score 업데이트용 함수
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE places p
  SET trending_score = COALESCE(
    (
      SELECT COUNT(*)
      FROM place_visits v
      WHERE v.place_id = p.id
        AND v.visited_at > NOW() - INTERVAL '7 days'
    ),
    0
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_trending_scores() IS '주 1회 호출 — 최근 7일 방문 수로 trending_score 갱신';

-- ── user_profiles last_login_at 자동 갱신 트리거 ───────────

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_last_login ON user_profiles;
CREATE TRIGGER trg_update_last_login
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();
