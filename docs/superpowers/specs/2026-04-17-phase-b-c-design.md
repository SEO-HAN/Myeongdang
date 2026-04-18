# 명당지도 Phase B + C 설계 스펙

**작성일:** 2026-04-17  
**담당:** Orchestrator (Silicon Valley PM + Product Designer + Developer + Saju CEO)  
**범위:** Phase B (B3~B5 UI/UX) + Phase C (C0~C5 사주 엔진 + 추천 로직)  
**실행 전략:** 2-트랙 병렬 worktree

---

## 배경 & 목표

명당지도 MVP의 핵심 가치는 두 가지다:
1. **정확한 사주 분석** — 사용자가 "이게 맞다"고 느낄 만큼 정밀한 오행 계산
2. **설득력 있는 명당 추천** — "왜 이 장소가 나에게 맞는가"를 사용자 언어로 설명

Phase B는 지도·장소 UX를 완성하고, Phase C는 사주 엔진을 전문가 수준으로 고도화한다.

---

## 실행 구조

```
worktree-B  (branch: feat/phase-b-ui)
  B3 → B4 → B5  (UI/UX 완성)

worktree-C  (branch: feat/phase-c-engine)
  C0 → C1 → C2 → C3 → C4 → C5  (엔진 + 추천 + 결과 UI)

메인: 두 PR merge → type-check → 테스트 100개 통과
```

---

## Track B — UI/UX 완성

### B3. PlaceBottomSheet — 3단계 스냅

**파일:** `components/map/PlaceBottomSheet.tsx`

**3단계 높이 스냅:**
- `peek`: 핸들 + 장소명 + CTA만 (80px)
- `mini`: 콘텐츠 절반 (40vh)
- `full`: 전체 (88vh)

**구현 방식:**
- framer-motion `drag="y"` + `useDragControls`
- `onDragEnd` velocity/offset 기준 스냅 결정:
  - velocity.y > 500 또는 offset.y > 150 → 닫기
  - velocity.y < -300 또는 offset.y < -100 → full로 확장
  - 그 외 → mini 유지
- `animate={{ height: snapHeight[currentSnap] }}` spring 전환
- "길찾기" 버튼: `py-3.5` (최소 48px 터치 타겟)

**DESIGN.md 적용:**
- 바텀시트 top radius: `rounded-t-[32px]`
- 배경: `#FFFFFF`, 그림자: `0 -4px 40px rgba(0,0,0,0.15)`
- 드래그 핸들: `w-10 h-1 rounded-full` warm gray

### B3. OhaengFilterBar — 보완

**파일:** `components/map/OhaengFilterBar.tsx`

현재 구현 상태 확인 후 미흡한 부분만 보완:
- 필터 칩 높이: `py-2` → `py-2.5` (44px 터치 타겟 확보)
- 선택 상태: 현재 hex 배경 → `ring-2 ring-offset-1 ring-[hex]` 추가로 강조
- "전체" 칩 이미 구현됨 — 유지

### B4. 장소 상세 페이지

**파일:** `app/place/[id]/page.tsx`

**이미지 갤러리:**
- `image_urls[]` 다중 지원 — 좌우 스와이프 (framer-motion drag="x")
- 썸네일 도트 인디케이터 하단 표시
- 이미지 없을 때: 오행 그라디언트 배경 (DESIGN.md 오행 색상)

**SNS 리뷰 미리보기:**
- `source_sns[]` → `PlaceBottomSheet`의 `SnsCard` 컴포넌트 재사용
- 최대 3개 표시, "더 보기" 링크

**근처 명당 추천:**
- `/api/places?ohaeng=[주오행]&limit=3` 호출 (현재 장소 제외)
- 가로 스크롤 카드 3개
- DESIGN.md Light Surface Card 스타일

**JSON-LD 보완:**
- `Place` 스키마에 `geo`, `aggregateRating` 추가

### B5. ShareCard 비주얼 개선

**파일:** `components/share/ShareCard.tsx`

**Canvas 카드 레이아웃 (1200×630):**
- 배경: 오행별 그라디언트 (`#0D0D1A` → 오행 hex)
- 상단: 앱 이름 "명당지도" (Noto Serif KR 느낌)
- 중단: 오행 이모지 대형 + "[이름]님의 사주" 텍스트
- 하단: 약한 오행 + 추천 장소명
- 우하단: URL 슬러그

---

## Track C — 사주 엔진 고도화 + 명당 추천 로직

### C0. 온보딩 확장 — 이름 + 성별

**파일:** `components/saju/BirthInputForm.tsx`, `store/user-store.ts`

**Step 0 추가** (기존 Step 1 앞):
- 이름 입력: 텍스트 필드 (최대 10자)
- 성별 선택: 남/여 카드 선택 (아이콘 카드 2개)
- `BirthFormData`에 `name: string`, `gender: 'male' | 'female'` 추가
- `UserStore`에 `name`, `gender` 필드 추가

**활용:**
- 이름: 결과 페이지 개인화 텍스트 "[이름]님의 사주"
- 성별: 대운(大運) 방향 계산 (양남음녀 순행, 양녀음남 역행) — Phase D 대운 기능 준비

### C1. 지장간(地藏干) + 오행 강도 정밀화

**파일:** `lib/saju/types.ts`, `lib/saju/engine.ts`

**JIJANGGAN 상수 추가** (`types.ts`):
```typescript
export const JIJANGGAN: Record<Jiji, Array<{ cheongan: Cheongan; ratio: number }>> = {
  子: [{ cheongan: '壬', ratio: 100 }],
  丑: [{ cheongan: '癸', ratio: 30 }, { cheongan: '己', ratio: 60 }, { cheongan: '辛', ratio: 10 }],
  寅: [{ cheongan: '戊', ratio: 7 }, { cheongan: '丙', ratio: 7 }, { cheongan: '甲', ratio: 86 }],
  卯: [{ cheongan: '甲', ratio: 10 }, { cheongan: '乙', ratio: 90 }],
  辰: [{ cheongan: '乙', ratio: 9 }, { cheongan: '癸', ratio: 3 }, { cheongan: '戊', ratio: 88 }],
  巳: [{ cheongan: '戊', ratio: 7 }, { cheongan: '庚', ratio: 7 }, { cheongan: '丙', ratio: 86 }],
  午: [{ cheongan: '丙', ratio: 10 }, { cheongan: '己', ratio: 10 }, { cheongan: '丁', ratio: 80 }],
  未: [{ cheongan: '丁', ratio: 9 }, { cheongan: '乙', ratio: 3 }, { cheongan: '己', ratio: 88 }],
  申: [{ cheongan: '戊', ratio: 7 }, { cheongan: '壬', ratio: 7 }, { cheongan: '庚', ratio: 86 }],
  酉: [{ cheongan: '庚', ratio: 10 }, { cheongan: '辛', ratio: 90 }],
  戌: [{ cheongan: '辛', ratio: 9 }, { cheongan: '丁', ratio: 3 }, { cheongan: '戊', ratio: 88 }],
  亥: [{ cheongan: '戊', ratio: 7 }, { cheongan: '甲', ratio: 7 }, { cheongan: '壬', ratio: 86 }],
}
```

**countOhaeng() 개선** (`engine.ts`):
- 천간: 1.0 가중치 유지
- 지지: 지장간 비율 반영 (`ratio / 100` 가중 합산)
- 기존 정수 카운트 → `Record<Ohaeng, number>` float 합산으로 변경
- 기존 35개 테스트 통과 유지

### C2. 절기(節氣) 정밀화

**파일:** `lib/saju/engine.ts`

- `korean-lunar-calendar` 패키지의 `getLunarToSolar` 또는 고정 테이블 연도별 확장
- 입춘 당일 시각(時刻) 경계 처리: `hour` 파라미터와 실제 절기 시각 비교
- 경계값 테스트 5개 추가:
  1. 2024-02-04 (입춘 당일) → 甲辰년
  2. 2024-02-03 (입춘 전날) → 癸卯년
  3. 각 주요 절기 경계일 3개

### C3. 용신(用神) / 희신(喜神) — 억부법

**파일:** `lib/saju/engine.ts`, `lib/saju/types.ts`

**알고리즘:**
```
일간 오행의 강도 총합 = 일간 천간(1.0) + 동일 오행 지지/지장간 합산
신강 기준: 일간 강도 합 > 전체 강도 평균 × 1.3
신강 → 설기(일간 생하는 오행) 오행을 용신
신약 → 생조(일간을 생하는 오행) 오행을 용신
```

**타입 확장** (`SajuResult`):
```typescript
yongshin: Ohaeng      // 용신 오행
heeshin: Ohaeng       // 희신 오행
bodyStrength: 'strong' | 'weak' | 'balanced'  // 신강/신약/중화
```

### C4. 합충(合沖) 분석

**파일:** `lib/saju/types.ts`, `lib/saju/engine.ts`

**상수 추가:**
- `CHEONGAN_HAP`: 천간합 6개 (갑기합토, 을경합금, 병신합수, 정임합목, 무계합화)
- `JIJI_CHUNG`: 지지충 6충 (자오충, 축미충, 인신충, 묘유충, 진술충, 사해충)
- `SAMHAP`: 삼합 4국 (수국, 목국, 화국, 금국)

**getHapChung() 함수:**
- 4기둥 내 합충 감지 → `HapChungResult[]` 반환
- 일진 vs 사주 합충 여부 → 개운 점수 반영

### C4. "나만의 명당" 추천 점수 로직

**파일:** `app/api/recommend/route.ts`, `lib/saju/recommend.ts` (신규)

**추천 점수 공식:**
```
finalScore = trust_score (기본)
           + weakOhaeng ∩ place.ohaeng × 15점 (최대 2개 = 30점)
           + yongshin ∩ place.ohaeng × 20점
           + luckPreference ∩ place.luck_types × 10점 (최대 2개 = 20점)
           + 오늘 일진 오행 ∩ place.ohaeng × 10점
           - hapChung 발생 시 × 5점
           → Math.min(finalScore, 100)
```

**API 응답 확장:**
```typescript
{
  place: PlaceRow,
  score: number,
  matchReasons: string[]  // 추천 이유 배열
}
```

### C5. 추천 결과 설명 UI

**파일:** `app/result/ResultClient.tsx`, `lib/saju/explain.ts` (신규)

**개인화 텍스트 생성 (`explain.ts`):**
```typescript
// 사주 요약
function buildSajuNarrative(result: SajuResult, name: string): string
// "[이름]님은 [강한오행] 기운이 넘치는 사주예요. [약한오행] 기운을 보충하면 더 큰 에너지를 발휘할 수 있습니다."

// 장소 추천 이유
function buildPlaceNarrative(place: PlaceRow, result: SajuResult): string  
// "[장소명]의 [오행] 기운이 당신의 부족한 [약한오행]을 채워줍니다."
```

**결과 페이지 레이아웃:**
1. "[이름]님의 사주" 헤더 (Noto Serif KR)
2. 오행 레이더 차트 (강도 시각화)
3. 사주 서사 텍스트 (개인화, 부드러운 톤)
4. 용신 표시: "오늘 당신에게 필요한 기운: [용신오행]"
5. "나만의 명당 TOP 3" 카드 (추천 점수 순)
   - 각 카드: 장소명 + 추천 이유 1줄 + 점수 배지
6. IlshinBanner (오늘의 일진)

---

## DESIGN.md 적용 원칙

모든 UI는 DESIGN.md를 엄격히 따른다:
- **다크 히어로**: `#0D0D1A` indigo-black (사주 결과 헤더 섹션)
- **크림 표면**: `#FAF8F2` (장소 카드, 콘텐츠 섹션)
- **브랜드 골드**: `#C9973A` (활성 상태, 진행률, 프리미엄 모멘트)
- **버밀리언 CTA**: `#D94F2A` (주 행동 버튼)
- **Noto Serif KR**: 감성 헤드라인, 앱 이름, 결과 헤드라인
- **터치 타겟**: 최소 44px, 주요 CTA 48px

---

## 품질 게이트

### Track B 완료 조건
- [ ] `npm run type-check` 오류 0개
- [ ] `npm run lint` 경고 0개
- [ ] 지도 → 필터 → 바텀시트(3-snap) → 상세 → 공유 플로우 동작
- [ ] `curl localhost:3000/place/1` → 200 OK

### Track C 완료 조건
- [ ] `npx ts-node lib/saju/engine.test.ts` — 100개 테스트 통과
- [ ] 지장간 반영 후 오행 강도 합계 ≈ 100% (±5%)
- [ ] 용신 계산: 3개 예시 사주 전문가 결과와 일치
- [ ] 추천 API: weakOhaeng 장소가 상위 3개에 포함

---

## 파일 변경 목록

### Track B
| 파일 | 변경 |
|------|------|
| `components/map/PlaceBottomSheet.tsx` | 3단계 스냅 구현 |
| `components/map/OhaengFilterBar.tsx` | 터치 타겟 보완 |
| `app/place/[id]/page.tsx` | 갤러리 + SNS + 근처 추천 |
| `components/share/ShareCard.tsx` | 오행 그라디언트 카드 |

### Track C
| 파일 | 변경 |
|------|------|
| `components/saju/BirthInputForm.tsx` | Step 0 (이름+성별) 추가 |
| `store/user-store.ts` | name, gender 필드 추가 |
| `lib/saju/types.ts` | JIJANGGAN, 합충 상수, SajuResult 확장 |
| `lib/saju/engine.ts` | 지장간 반영, 용신/합충 함수 |
| `lib/saju/explain.ts` | 신규 — 개인화 텍스트 생성 |
| `lib/saju/recommend.ts` | 신규 — 추천 점수 로직 |
| `app/api/recommend/route.ts` | 점수 기반 추천 API 확장 |
| `app/result/ResultClient.tsx` | 이름, 용신, 추천 TOP3 UI |
| `lib/saju/engine.test.ts` | 테스트 100개로 확장 |
