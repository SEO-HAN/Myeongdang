# UX 개인화 리디자인 — 사주 기반 명소 추천 MVP

**Date:** 2026-04-17
**Status:** Approved
**Scope:** Track A (결과 페이지), Track B (장소 상세 개인화), Track C (지도 메인 개인화)

---

## 핵심 원칙

"나만의 명당 추천"이 서비스의 heart. 모든 화면에서 개인화된 추천 근거가 스토리로 전달되어야 함.

---

## Track A — 결과 페이지 재구조화

### 레이아웃 변경

**Before:** Hero(부족 오행) → 분석 카드 → 용신 → TOP3 → 일진 → 공유
**After:** Hero(사주 요약 + 감성 서사) → **나만의 명당 TOP3** (풀폭 카드) → 오행 분석(접힘) → 일진 + 오늘의 명당 → 공유

### 추천 카드 (풀폭)

각 카드 구성:
- 장소 이미지 or 오행 그라디언트 배경
- 장소명 + 오행 뱃지
- **개인화 추천 이유 2~3줄** (`buildDetailedPlaceNarrative()`)
- 궁합 점수 시각화 (프로그레스 바 + "당신과의 궁합 92%")
- 카카오맵 바로가기 CTA

### explain.ts 확장

`buildDetailedPlaceNarrative(place, result, luckPreference?)` — 용신, 약한 오행, 운 선호도를 조합한 2~3문장 서사.

### OhaengResultCard 접기/펼치기

기본 접힘 상태. "오행 분석 상세 보기" 탭으로 펼침. 결과 페이지 진입 시 추천 명당이 fold 위에 보이도록.

---

## Track B — 장소 상세 개인화

### SajuCompatibility 컴포넌트 (신규)

`components/place/SajuCompatibility.tsx` — Client Component

- Zustand store에서 `profile` 읽기
- `scorePlace()` 클라이언트에서 실행
- 궁합 점수 원형 프로그레스
- 개인화 이유 카드 (용신 매칭, 약한 오행 보충, 운 선호도 각각)
- 비로그인: "내 사주로 궁합 보기" CTA → /onboarding

### place/[id] 배치

이미지 갤러리 바로 아래, 장소명 위에 삽입.

---

## Track C — 지도 메인 개인화 강화

### PlaceBottomSheet 궁합 뱃지

개인화 모드 ON일 때 바텀시트 peek에 "궁합 87%" 뱃지.

### PersonalizationBanner 감성 메시지

"당신의 부족한 [목] 기운을 채워줄 명당 3곳을 찾았어요" 식 메시지.

### getDailyRecommendation()

일진 오행 + 사주 기반 하루 1곳 추천 함수.

---

## 영향받는 파일

| Track | 파일 | 변경 유형 |
|-------|------|-----------|
| A | `lib/saju/explain.ts` | 함수 추가 |
| A | `app/result/ResultClient.tsx` | 레이아웃 재구조화 |
| A | `components/saju/OhaengResultCard.tsx` | disclosure 기능 |
| B | `app/place/[id]/page.tsx` | 개인화 섹션 추가 |
| B | `components/place/SajuCompatibility.tsx` | **신규** |
| C | `components/map/PlaceBottomSheet.tsx` | 궁합 뱃지 |
| C | `components/map/PersonalizationBanner.tsx` | 감성 메시지 |
| C | `lib/saju/recommend.ts` | 함수 추가 |
