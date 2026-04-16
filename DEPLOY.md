# 명당지도 — Vercel 배포 체크리스트

> 단계별 순서대로 진행. 각 단계 완료 후 ✅ 표시.

---

## 1단계 — 카카오 Developers 설정

1. https://developers.kakao.com 접속 → 내 애플리케이션 → 새 앱 생성
2. 플랫폼 → Web 플랫폼 추가 → 사이트 도메인 입력 (localhost:3000 + 실제 도메인)
3. **JavaScript 키** 복사 (지도 SDK용)
4. 카카오 로그인 → 활성화 → Redirect URI: `https://your-domain.vercel.app/auth/kakao/callback`
5. 카카오톡 공유 → 활성화 (ShareCard 사용)

---

## 2단계 — Supabase 프로젝트 설정

1. https://supabase.com → New Project 생성
2. SQL Editor → `supabase/migrations/001_create_tables.sql` 실행
3. SQL Editor → `supabase/migrations/002_seed_data.sql` 실행
4. Settings → API → **URL**, **anon key**, **service_role key** 복사
5. Authentication → Providers → Kakao 활성화 (향후 로그인 연동 시)
6. Storage → 버킷 생성 (이미지 업로드 시 필요)

---

## 3단계 — 환경변수 설정

`.env.local` 파일 생성 (`.env.local.example` 참고):

```bash
# 카카오
NEXT_PUBLIC_KAKAO_MAP_KEY=<JavaScript 키>
KAKAO_CLIENT_ID=<REST API 키>
KAKAO_CLIENT_SECRET=<보안 키>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 앱 URL
NEXT_PUBLIC_APP_URL=https://myeongdang.vercel.app

# AI (선택, F단계)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 4단계 — 로컬 빌드 검증

```bash
cd Myeongdang

# 의존성 설치
npm install

# 사주 엔진 테스트 (35/35 통과 확인)
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts

# 타입 체크
npm run type-check

# 프로덕션 빌드 (오류 없음 확인)
npm run build

# 로컬 서버 실행 후 기능 확인
npm run start
```

### 로컬 기능 체크리스트
- [ ] `localhost:3000` → 지도 + 30개 명당 마커 표시
- [ ] 오행 필터 5개 버튼 클릭 → 마커 필터링
- [ ] 마커 클릭 → 바텀시트 애니메이션
- [ ] `/onboarding` → 4단계 폼 작동
- [ ] `/result?y=1990&m=7&d=15&h=14` → 오행 분석 결과 표시
- [ ] `/api/og?y=1990&m=7&d=15` → OG 이미지 생성 확인
- [ ] `/place/관악산-연주대-id` → 장소 SEO 페이지

---

## 5단계 — Vercel 배포

```bash
# Vercel CLI 설치 (처음 한 번)
npm i -g vercel

# 배포
vercel

# 또는 GitHub 연동 후 자동 배포:
# GitHub → Vercel Dashboard → Import Repository
```

### Vercel 환경변수 설정
Dashboard → Project → Settings → Environment Variables에 `.env.local` 내용 입력

### 권장 설정
- Framework Preset: **Next.js** (자동 감지)
- Build Command: `npm run build` (기본값)
- Output Directory: `.next` (기본값)
- Node.js Version: **20.x**

---

## 6단계 — 배포 후 검증

```bash
# OG 이미지 API 확인
curl -I https://myeongdang.vercel.app/api/og?y=1990&m=7&d=15

# 메타데이터 확인
curl -s https://myeongdang.vercel.app/result?y=1990&m=7&d=15 | grep -o '<title>.*</title>'
```

### 검증 도구
- **OG 디버거**: https://developers.facebook.com/tools/debug/
- **Twitter Card**: https://cards-dev.twitter.com/validator
- **카카오 공유 디버거**: https://developers.kakao.com/tool/clear/og
- **PWA 체크**: Chrome DevTools → Application → Manifest
- **Lighthouse**: 성능/SEO/PWA 점수 확인

### 최종 체크리스트
- [ ] OG 이미지 1200×630 정상 표시
- [ ] Twitter/카카오 공유 카드 미리보기 정상
- [ ] PWA 설치 배너 표시 (Android Chrome)
- [ ] Apple Touch Icon 표시 (iOS Safari)
- [ ] Lighthouse PWA 점수 80+
- [ ] Lighthouse SEO 점수 90+
- [ ] 30개 시드 데이터 모두 조회
- [ ] `/place/[id]` JSON-LD Google Rich Results Test 통과

---

## 커스텀 도메인 연결 (선택)

Vercel Dashboard → Domains → Add Domain → DNS 설정
- A Record: `76.76.21.21`
- CNAME: `cname.vercel-dns.com`

---

## F단계 — 다음 개발 계획

| 기능 | 파일 | 예상 기간 |
|------|------|-----------|
| 카카오 OAuth 로그인 | `app/auth/kakao/route.ts` | 1일 |
| 북마크 DB 동기화 | `app/api/bookmarks/route.ts` | 0.5일 |
| 오늘의 개운 (일진) | `lib/saju/ilshin.ts` | 2일 |
| 장소 자동 수집 파이프라인 | `scripts/collect-places.ts` | 3일 |
| 리뷰/댓글 기능 | `app/api/reviews/route.ts` | 2일 |
| 관리자 대시보드 | `app/admin/page.tsx` | 3일 |
