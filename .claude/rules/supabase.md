---
paths:
  - "supabase/**"
  - "lib/supabase.ts"
  - "app/api/**/*.ts"
---

# Supabase & 데이터베이스 규칙

## 클라이언트 선택 원칙

| 컨텍스트 | 사용 클라이언트 | 이유 |
|---------|--------------|------|
| Server Component | `createServerClient` + `cookies()` | 세션 쿠키 접근 |
| Route Handler | `createServerClient` + `cookies()` | 세션 쿠키 접근 |
| middleware.ts | `createServerClient` + request/response cookies | 세션 갱신 |
| Client Component | `createBrowserClient` | 브라우저 쿠키 자동 처리 |
| 관리 작업 | `createClient(SERVICE_ROLE_KEY)` | RLS 우회, 서버 전용 |

## RLS (Row Level Security) 정책 요약

```sql
-- places, place_contents: 공개 읽기
SELECT: 인증 없이 가능

-- user_profiles: 본인만 CRUD
auth.uid()::text = kakao_id

-- 마이그레이션 변경 시 반드시 RLS 정책도 함께 업데이트
```

## 마이그레이션 규칙

```sql
-- 파일 네이밍: NNN_description.sql (순번 유지)
-- 001_create_tables.sql (테이블 + RLS + 인덱스)
-- 002_seed_data.sql (30개 시드 장소)
-- 003_next_migration.sql (추가 변경사항)

-- 항상 IF NOT EXISTS 사용 (재실행 안전)
CREATE TABLE IF NOT EXISTS places (...);

-- 인덱스는 GIN 사용 (배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_places_ohaeng ON places USING GIN (ohaeng);
```

## 주요 테이블 스키마 요약

```typescript
// places
{
  id: uuid, name: text, address: text,
  lat: numeric, lng: numeric,
  ohaeng: text[],      // ['목', '수'] — GIN 인덱스
  luck_types: text[],  // ['사업운', '승진운'] — GIN 인덱스
  trust_score: int,    // 0-100
  expert_verified: bool,
  reason_text: text,   // 풍수 근거 (필수)
  image_urls: text[],
  kakaomap_url: text,
  trending_score: int
}

// user_profiles
{
  kakao_id: text (UNIQUE),  // 카카오 sub
  birth_year/month/day/hour: int,
  ohaeng_analysis: jsonb,   // SajuResult 전체 저장
  weak_ohaeng: text[],
  bookmarks: uuid[],
  visited: jsonb
}
```

## 쿼리 최적화

```typescript
// ✅ 필요한 컬럼만 SELECT
supabase.from('places').select('id, name, lat, lng, ohaeng, trust_score')

// ✅ 배열 오버랩 필터
.overlaps('ohaeng', ['목', '수'])

// ✅ 정렬 + 제한
.order('trust_score', { ascending: false }).limit(50)

// ❌ select('*') — 불필요한 데이터 전송 (이미지 URL 등 무거운 필드)
//   단, 단일 레코드 조회(place detail)에서는 허용
```

## 보안 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 `NEXT_PUBLIC_`으로 시작하지 않음
- [ ] 클라이언트 사이드 코드에서 서비스 롤 키 사용 없음
- [ ] 사용자 데이터 변경은 RLS + auth.uid() 검증 거침
- [ ] SQL 파라미터는 항상 Supabase 클라이언트 빌더 사용 (SQL 인젝션 방지)
