# 명당지도 MASTERPLAN
<!-- 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악하고 WORKLOG.md에서 마지막 작업을 확인하세요 -->

## 📍 현재 위치

**단계:** Phase D (G단계 기능 + 배포)  
**상태:** Phase B 전체 완료 ✅, Phase C 전체 완료 ✅ → Phase D 대기  
**마지막 업데이트:** 2026-04-17 (Phase B+C 에이전트 병렬 구현 완료)  
**다음 할 일:** D1 리뷰/댓글 시스템 또는 D4 배포 파이프라인

---

## 전체 로드맵

```
Phase A: 에이전트 환경 구축      ██████████ 100% ✅
Phase B: UX/UI 리디자인          ██████████ 100% ✅
Phase C: 사주 엔진 고도화         ██████████ 100% ✅
Phase D: G단계 기능 + 배포        ░░░░░░░░░░   0% ⏳
```

> Phase A는 두 번의 세션에 걸쳐 완료: A1(Mock 환경), A2(파일 지속성), A3(멀티에이전트 하네스)

---

## Phase A — 에이전트 환경 구축 ✅ DONE

> 목표: 컨텍스트 없이도 작업이 이어질 수 있는 실무자 수준 하네스 환경

- [x] A1. Mock 환경 구축 (Supabase/Kakao 없이 localhost:3000 실행)
  - [x] `lib/mock-data.ts` — 30개 시드 데이터 + `isMockMode()`
  - [x] `.env.local` — `NEXT_PUBLIC_MOCK_MODE=true`
  - [x] `middleware.ts` — try/catch로 mock Supabase 오류 무시
  - [x] `app/not-found.tsx` — `'use client'` 추가 (styled-jsx 오류 수정)
  - [x] `components/map/KakaoMap.tsx` — `DevMap` SVG 대체 컴포넌트
  - [x] `hooks/useKakaoMap.ts` — `skip` 파라미터 추가
  - [x] `app/api/places/route.ts` — Mock 분기 추가
  - [x] `app/place/[id]/page.tsx` — Mock 분기 추가

- [x] A2. 파일 기반 지속성 환경 세팅 (이 파일 + WORKLOG.md + AGENT_ENV.md)
  - [x] `MASTERPLAN.md` 생성
  - [x] `WORKLOG.md` 생성
  - [x] `.claude/AGENT_ENV.md` 생성
  - [x] `CLAUDE.md` 업데이트 — 플랜 파일 포인터 추가
  - [x] Auto-memory 파일 작성
  - [x] `.claude/hooks/session-start.sh` 업데이트

- [x] A3. 멀티 에이전트 하네스 구축 (plan-agents.md Phase A 기준)
  - [x] `CLAUDE.md` 멀티에이전트 섹션 추가 — 5개 에이전트 역할/권한/금지사항 정의
  - [x] `.claude/rules/ux-design.md` 생성 — Progressive Disclosure, 모바일 UX 기준
  - [x] `.claude/rules/saju-domain-deep.md` 생성 — 지장간, 용신, 합충, 절기 정밀화
  - [x] `.claude/rules/performance.md` 생성 — Core Web Vitals, 번들 최적화
  - [x] `.claude/rules/testing-strategy.md` 생성 — 품질 게이트, 테스트 기준
  - [x] `.claude/hooks/stop-gate.sh` 강화 — UX 일관성 체크 추가 (use client 검증, 터치 타겟 경고)
  - [x] `~/.claude/plugins/myeongdang/skills/saju-accuracy-checker/SKILL.md` 생성
  - [x] `~/.claude/plugins/myeongdang/skills/ux-flow-reviewer/SKILL.md` 생성
  - [x] `~/.claude/plugins/myeongdang/skills/deployment-readiness/SKILL.md` 생성

**DoD A단계:** `npm run dev` → localhost:3000 정상, 모든 페이지 200 OK, API 필터링 동작, 멀티에이전트 하네스 완비

---

## Phase B — UX/UI 리디자인 ✅ DONE

> 목표: 배포 가능한 수준의 서비스 품질 달성. 3단계 점진적 공개 + 감성 디자인

### B1. 온보딩 플로우 재설계 ✅ DONE
- [x] `components/saju/BirthInputForm.tsx` — 4단계 → 3단계 재설계
- [x] `app/onboarding/page.tsx` — 탭 구조 제거, 단순화

### B2. 결과 페이지 리디자인 ✅ DONE
- [x] `app/result/ResultClient.tsx` — IlshinBanner, 공유 CTA 3개

### B3. 지도 메인 화면 개선 ✅ DONE
- [x] `components/map/PlaceBottomSheet.tsx` — peek/mini/full 3단계 스냅 (framer-motion drag)
- [x] `components/map/OhaengFilterBar.tsx` — 터치 타겟 py-2.5, ring-2 active 강조
- [x] `components/map/PersonalizationBanner.tsx` — CTA 개선, 개인화 ON/OFF

### B4. 장소 상세 페이지 개선 ✅ DONE
- [x] `components/place/ImageGallery.tsx` — 다중 이미지 갤러리, 도트 인디케이터, 오행 그라디언트 폴백
- [x] `components/place/NearbyPlaces.tsx` — 같은 오행 기준 가로 스크롤 3카드
- [x] `app/place/[id]/page.tsx` — 갤러리 + 근처 명당 추천 통합

### B5. 공유 기능 강화 ✅ DONE
- [x] `components/share/ShareCard.tsx` — 오행 그라디언트 캔버스 카드 (이름 + 오행 이모지 + 장소)

**DoD:** ✅ type-check 0 오류, 3-snap 바텀시트 동작, 장소 상세 갤러리, 공유 카드 비주얼

---

## Phase C — 사주 엔진 고도화 ✅ DONE

> 목표: 정확도 95%+ 달성, 실제 사주 전문가 검증 수준, 나만의 명당 추천 엔진

### C0. 온보딩 확장 — 이름 + 성별 ✅ DONE
- [x] `components/saju/BirthInputForm.tsx` — Step 0 (이름 + 남/여 카드 선택) 추가 → 4단계
- [x] `store/user-store.ts` — `userName`, `userGender` 필드 추가

### C1. 지장간(地藏干) + 오행 강도 정밀화 ✅ DONE
- [x] `lib/saju/types.ts` — `JIJANGGAN` 상수 (12지지 × 여기장간 비율)
- [x] `lib/saju/engine.ts` — `countOhaengWeighted()`: 천간 1.0, 지지 지장간 ratio/100 가중 합산

### C2. 용신(用神) / 희신(喜神) — 억부법 ✅ DONE
- [x] `lib/saju/engine.ts` — `calculateYongshin()`: 신강/신약 판별 → 용신/희신 오행 도출
- [x] `SajuResult`에 `bodyStrength`, `yongshin`, `heeshin` 필드 추가

### C3. 합충(合沖) 분석 ✅ DONE
- [x] `lib/saju/types.ts` — `CHEONGAN_HAP`, `JIJI_CHUNG`, `SAMHAP` 상수
- [x] `lib/saju/engine.ts` — `getHapChung()` 함수 (4기둥 내 합충 감지)
- [x] `SajuResult`에 `hapChung: HapChungItem[]` 추가

### C4. 나만의 명당 추천 로직 ✅ DONE
- [x] `lib/saju/recommend.ts` — `scorePlace()`, `rankPlaces()` (trust_score + weakOhaeng + yongshin + luckPref - hapChung)
- [x] `app/api/recommend/route.ts` — rankPlaces() 기반 추천 API, matchReasons[] 포함

### C5. 추천 결과 설명 UI + 개인화 텍스트 ✅ DONE
- [x] `lib/saju/explain.ts` — `buildSajuNarrative()`, `buildYongshinNarrative()`, `buildPlaceNarrative()`
- [x] `app/result/ResultClient.tsx` — "[이름]님의 사주" 헤더, 용신 카드, TOP3 추천 장소

**DoD:** ✅ type-check 0 오류, 엔진 테스트 61개 통과, 추천 API matchReasons 포함

---

## Phase D — G단계 기능 + 배포 ⏳

> 목표: G단계 기획 완료, Vercel 프로덕션 배포, 베타 사용자 10명 획득

### D1. 리뷰/댓글 시스템
- [ ] `supabase/migrations/003_reviews.sql`
- [ ] `app/api/reviews/route.ts` — GET/POST
- [ ] `components/place/ReviewSection.tsx`
- [ ] RLS: 로그인 사용자만 작성, 본인만 삭제

### D2. 관리자 대시보드
- [ ] `app/admin/` — 관리자 전용 라우트 (middleware 보호)
- [ ] 장소 추가/수정/삭제 UI
- [ ] 리뷰 모더레이션 UI
- [ ] 방문자/인기 장소 통계

### D3. 푸시 알림
- [ ] Web Push API + VAPID 키 설정
- [ ] 일진 알림 (매일 오전 6시)
- [ ] 북마크 장소 업데이트 알림
- [ ] `supabase/migrations/004_push_subscriptions.sql`

### D4. 배포 파이프라인
- [ ] Vercel 프로젝트 연결 + 환경변수 설정
- [ ] GitHub Actions CI (type-check + lint + 사주 테스트)
- [ ] Supabase 프로덕션 DB 마이그레이션 실행
- [ ] 카카오 개발자 센터 — 실서비스 도메인 등록
- [ ] Lighthouse 점수 목표: Performance 90+, SEO 95+

### D5. 분석 & 모니터링
- [ ] Vercel Analytics 연동
- [ ] Supabase 쿼리 성능 모니터링
- [ ] 오류 추적 (Sentry 또는 Vercel Log Drains)

---

## 규칙 요약 (빠른 참조)

| 규칙 | 요약 |
|------|------|
| R1 | Server/Client 경계 엄수. 클라이언트엔 `'use client'` 필수 |
| R2 | 서버 = `createServerClient`, 클라이언트 = `createBrowserClient` |
| R3 | Zustand `persist` 에 `skipHydration:true` + useEffect에서 rehydrate |
| R4 | Kakao Maps → `withKakao()` 콜백 패턴만 사용 |
| R5 | `SUPABASE_SERVICE_ROLE_KEY` 절대 클라이언트 노출 금지 |
| R6 | OG 이미지 URL 항상 절대 URL |

---

## 핵심 파일 맵 (빠른 탐색)

```
변경 빈도 높음:
  components/map/KakaoMap.tsx        ← 지도 + DevMap
  components/map/PlaceBottomSheet.tsx ← 바텀시트
  app/onboarding/page.tsx            ← 온보딩 폼
  app/result/ResultClient.tsx        ← 결과 화면
  lib/saju/engine.ts                 ← 사주 엔진 (테스트 필수)

변경 빈도 낮음:
  lib/mock-data.ts                   ← Mock 데이터 (30개 장소)
  store/user-store.ts                ← Zustand 스토어
  middleware.ts                      ← Supabase 세션 갱신
  types/database.ts                  ← DB 타입 정의
```
