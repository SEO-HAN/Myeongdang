# 명당지도 MASTERPLAN
<!-- 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악하고 WORKLOG.md에서 마지막 작업을 확인하세요 -->

## 📍 현재 위치

**단계:** Phase B (UX/UI 리디자인)  
**상태:** Phase A 완료 → Phase B Step 1 대기  
**마지막 업데이트:** 2026-04-16 (환경 세팅 완료)  
**다음 할 일:** `WORKLOG.md`의 "NEXT" 항목 확인

---

## 전체 로드맵

```
Phase A: 에이전트 환경 구축      ██████████ 100% ✅
Phase B: UX/UI 리디자인          ░░░░░░░░░░   0% ⏳
Phase C: 사주 엔진 고도화         ░░░░░░░░░░   0% ⏳
Phase D: G단계 기능 + 배포        ░░░░░░░░░░   0% ⏳
```

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

**DoD A단계:** `npm run dev` → localhost:3000 정상, 모든 페이지 200 OK, API 필터링 동작

---

## Phase B — UX/UI 리디자인 ⏳ NEXT

> 목표: 배포 가능한 수준의 서비스 품질 달성. 3단계 점진적 공개 + 감성 디자인

### B1. 온보딩 플로우 재설계
- [ ] `app/onboarding/page.tsx` — 4단계 폼을 3단계로 재구성
  - 단계 1: 생년월일 (캘린더 인풋 UX 개선)
  - 단계 2: 태어난 시간 (자시/축시 등 시각적 선택)
  - 단계 3: 기대하는 운 선택 (운 유형 아이콘 카드)
- [ ] 진행률 인디케이터 (상단 프로그레스 바)
- [ ] 각 단계 애니메이션 (framer-motion slide 전환)
- [ ] 카카오 OAuth 버튼 배치 최적화
- **DoD:** 3단계 완주 후 `/result`로 정상 이동, 모바일 375px 기준 스크롤 없이 1뷰

### B2. 결과 페이지 리디자인
- [ ] `app/result/page.tsx` + `ResultClient.tsx` 개선
  - 상단: 오행 레이더 차트 (현재 유지, 사이즈 최적화)
  - 중단: 일진 배너 (IlshinBanner 위치 재배치)
  - 하단: 추천 명당 카드 3개 (가로 스크롤 캐러셀)
- [ ] `components/saju/OhaengResultCard.tsx` — 카드 디자인 개선
  - 오행 색상 그라디언트 배경
  - 용신/희신 표시 추가
  - 개운 팁 1줄 추가
- [ ] 공유 버튼 (ShareCard) 상단 고정 → 하단 플로팅 버튼으로 이동
- **DoD:** 결과 화면이 소셜 공유 시 카드 미리보기처럼 보임

### B3. 지도 메인 화면 개선
- [ ] `components/map/PlaceBottomSheet.tsx` — 바텀시트 UX 개선
  - 3단계 높이 스냅 (핸들만 / 미니 / 풀스크린)
  - 장소 카드 내 "길찾기" 버튼 크기 증가
  - 장소 상세 preview 이미지 추가
- [ ] `components/map/OhaengFilterBar.tsx` — 필터 바 재설계
  - 필터 칩 크기 증가 + 선택 상태 강조
  - "전체" 칩 추가 (필터 초기화)
  - 필터 선택 시 지도 카메라 이동 (해당 오행 명당 중심)
- [ ] `components/map/PersonalizationBanner.tsx` — 개인화 배너 개선
  - 로그인 안 된 경우: "사주 입력해서 내 명당 찾기" CTA
  - 로그인 된 경우: 오늘 일진 + 개운 명당 바로가기
- [ ] DevMap 개선 (Mock 모드 SVG 지도 품질 향상)
  - 실제 서울 지역 윤곽선 추가
  - 마커 클러스터링 (겹치는 마커 그룹핑)
- **DoD:** 지도에서 필터 → 바텀시트 → 상세 → 카카오맵 딥링크 전체 플로우 동작

### B4. 장소 상세 페이지 개선
- [ ] `app/place/[id]/page.tsx` 개선
  - 이미지 갤러리 (image_urls 다중 지원)
  - SNS 리뷰 미리보기 (place_contents 연동)
  - 근처 명당 추천 섹션 (같은 오행 기준)
  - 카카오맵 임베드 (실 서비스 시)
- [ ] JSON-LD 구조화 데이터 보완 (별점, 리뷰 수 실제 데이터 연동)
- **DoD:** Lighthouse SEO 점수 90+, OG 카드 카카오톡에서 정상 표시

### B5. 공유 기능 강화
- [ ] `components/share/ShareCard.tsx` — 캔버스 카드 개선
  - 오행 이모지 + 색상 그라디언트 배경
  - 사용자 사주 결과 요약 텍스트
  - QR 코드 또는 URL 슬러그 추가
- [ ] 카카오톡 공유 SDK 연동 (현재 navigator.share 대체)
- **DoD:** 카카오톡으로 공유 시 이미지 카드 + 링크 함께 발송됨

---

## Phase C — 사주 엔진 고도화 ⏳

> 목표: 정확도 95%+ 달성, 실제 사주 전문가 검증 수준

### C1. 지장간(支藏干) 구현
- [ ] `lib/saju/types.ts` — `JIJANGGAN` 상수 추가
- [ ] `lib/saju/engine.ts` — `getJijanggan()` 함수
- [ ] 지지의 숨겨진 천간 반영 → 오행 점수 정밀화
- **DoD:** 35개 기존 테스트 케이스 모두 통과

### C2. 절기(節氣) 정밀화
- [ ] `lib/saju/engine.ts` — 24절기 실제 시각 테이블 (연도별 오차 보정)
- [ ] 월주 계산 오차 ±1일 → ±0일 목표
- **DoD:** 절기 경계일 (예: 입춘 당일) 테스트 케이스 5개 추가 통과

### C3. 용신(用神) / 희신(喜神) 계산
- [ ] `lib/saju/engine.ts` — `getYongshin()`, `getHeeshin()`
- [ ] 강약 분석 기반 용신 도출 로직
- [ ] `app/result/ResultClient.tsx` — 용신 표시 UI 추가
- **DoD:** 3개 예시 사주에 대해 전문가 결과와 일치

### C4. 합충(合沖) 분석
- [ ] `lib/saju/types.ts` — 천간합, 지지합, 삼합, 방합, 형충파해 상수
- [ ] `lib/saju/engine.ts` — `getHapChung()` 함수
- [ ] 일진과 사주의 합충 표시 → 개운 점수 반영
- **DoD:** 일진 API 응답에 합충 정보 포함

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
