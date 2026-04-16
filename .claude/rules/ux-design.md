---
paths:
  - "app/onboarding/**"
  - "app/result/**"
  - "components/map/**"
  - "components/saju/**"
  - "components/share/**"
  - "components/auth/**"
---

# UX/UI 디자인 규칙

<!-- 담당 에이전트: UXDesigner Agent — Phase B 전반 -->

## 핵심 원칙

명당지도의 UX는 **Progressive Disclosure(점진적 공개)** 원칙을 따른다.
사용자에게 즉각적인 가치를 주고, 개인화는 자연스럽게 유도한다.

## 3단계 점진적 공개 플로우

```
Stage 1 — 즉각 가치 (0~30초, 로그인 불필요)
  진입 → 오늘의 명당 3곳 즉시 노출 + 오늘 일진 배너
  → "내 사주에 맞게 필터하기" CTA

Stage 2 — 개인화 진입 (30초~2분)
  오행 퀴즈 3문항 (이미지 선택, 30초 완료)
  → 오행 분석 결과 + 맞춤 명당 필터 적용
  → "더 정확한 분석" → 생년월일 입력 유도

Stage 3 — 딥 인게이지먼트 (재방문)
  카카오 로그인 → 사주 복원 → 일진 알림 → 체크인 → 공유
```

## 모바일 퍼스트 기준 (375px)

```tsx
// ✅ 스크롤 없이 1뷰에 핵심 CTA 포함
// ✅ 터치 타겟 최소 44px × 44px
// ✅ 폰트 최소 14px (가독성), 본문 16px
// ✅ iOS Safe Area 반드시 적용
<div className="pb-safe pt-safe">

// ❌ 데스크탑 우선 레이아웃 금지
// ❌ hover 인터랙션 단독 사용 금지 (터치 미지원)
```

## 온보딩 폼 규칙

```tsx
// ✅ 각 단계는 1뷰 (375px) 기준 스크롤 없이 완성
// ✅ 상단 프로그레스 바 필수 (현재 단계 / 전체 단계)
// ✅ framer-motion slide 전환 — 다음: x: -100%, 이전: x: 100%
// ✅ 각 단계 입력 후 즉시 다음 단계로 자동 이동 (500ms delay)
// ✅ 뒤로가기 버튼 — 이전 단계로 (브라우저 히스토리 아님)
// ❌ 단계 건너뛰기 금지 (검증 없는 다음 이동)

// 진행률 표시 패턴
<div className="flex gap-1">
  {steps.map((_, i) => (
    <div
      key={i}
      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
        i <= currentStep ? 'bg-amber-500' : 'bg-gray-200'
      }`}
    />
  ))}
</div>
```

## 애니메이션 규칙

```tsx
// ✅ 슬라이드 전환 (onboarding 단계 전환)
const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
}
<AnimatePresence initial={false} custom={direction} mode="wait">
  <motion.div key={step} custom={direction} variants={variants}
    initial="enter" animate="center" exit="exit"
    transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
</AnimatePresence>

// ✅ 바텀시트 — 드래그 닫기 포함
// ✅ 카드 등장 — staggerChildren 0.05s
// ❌ 3초 이상 지속 애니메이션 금지
// ❌ prefers-reduced-motion 무시 금지
```

## 색상 & 오행 비주얼 시스템

```tsx
// 오행별 색상은 OHAENG_COLOR 상수만 사용
// 목: 초록 그라디언트 — 성장, 봄
// 화: 붉은 오렌지 — 열정, 여름
// 토: 황토 — 안정, 환절기
// 금: 은백 — 명예, 가을
// 수: 청남 — 지혜, 겨울

// 그라디언트 배경 패턴
const gradient = `bg-gradient-to-br ${OHAENG_COLOR[ohaeng].gradientFrom} ${OHAENG_COLOR[ohaeng].gradientTo}`
```

## CTA 버튼 계층

```
Primary   — 채워진 버튼, 오행 메인 컬러 (가장 중요한 행동 1개)
Secondary — 아웃라인 버튼, 차선 행동
Ghost     — 텍스트만, 건너뛰기/나중에
Floating  — 우하단 고정, 공유/저장 (스크롤 무관 항상 노출)
```

## 접근성 필수 기준

```tsx
// ✅ 모든 이미지 alt 텍스트
// ✅ 인터랙티브 요소 aria-label
// ✅ 포커스 링 (outline: none 단독 금지)
// ✅ 색상 대비 4.5:1 이상 (WCAG AA)
// ✅ 스크린리더 논리적 읽기 순서

<button
  aria-label={`${place.name} 상세 보기`}
  className="focus-visible:ring-2 focus-visible:ring-amber-500"
  onClick={() => openPlace(place)}
>
```

## UX 금지사항

```
❌ 팝업/모달이 3개 이상 중첩
❌ 자동 재생 영상/오디오
❌ 스와이프 외 동작 요구 (핀치, 멀티터치 필수화)
❌ 로딩 스피너 2초 이상 단독 노출 — 스켈레톤 UI 사용
❌ 오류 메시지 기술적 용어 사용 ("네트워크 오류" → "잠시 후 다시 시도해 주세요")
❌ 비로그인 사용자에게 로그인 강제 (첫 방문 시)
```
