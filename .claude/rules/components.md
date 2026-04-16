---
paths:
  - "components/**/*.tsx"
  - "app/**/ResultClient.tsx"
  - "app/**/MapClient.tsx"
---

# React 컴포넌트 규칙

## Client Component 필수 선언

```tsx
'use client'  // ← 모든 컴포넌트 파일 첫 줄
```

## Props 타입 정의

```tsx
// ✅ 명시적 인터페이스
interface PlaceBottomSheetProps {
  place: PlaceRow | null
  isOpen: boolean
  onClose: () => void
}

export default function PlaceBottomSheet({ place, isOpen, onClose }: PlaceBottomSheetProps) {
  // ...
}
```

## Zustand 사용 패턴

```tsx
// 편의 셀렉터 사용 (불필요한 리렌더 방지)
const selectedPlace = useSelectedPlace()  // ← hooks/useUserStore에서
const { openPlace, closePlace } = useUserStore()  // 액션은 전체 구독 허용

// ❌ 전체 스토어 구독 피하기
const store = useUserStore()  // 모든 변경에 리렌더
```

## framer-motion 패턴

```tsx
// AnimatePresence — 언마운트 애니메이션
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* 바텀시트 내용 */}
    </motion.div>
  )}
</AnimatePresence>

// 드래그로 닫기
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.y > 80 || info.velocity.y > 400) onClose()
  }}
>
```

## 지도 컴포넌트 특이사항

```tsx
// KakaoMap.tsx — OverlayMap 캐시 패턴
const overlayMap = useRef<Map<string, KakaoCustomOverlay>>(new Map())

// places 변경 시: 기존 오버레이 재활용 (DOM 재생성 방지)
// 사라진 place: setMap(null)
// 새 place: createOverlay()
// 기존 place: setContent(새 HTML)
```

## 오행 컬러 사용

```tsx
// ✅ 타입 안전한 방법
import { OHAENG_COLOR } from '@/lib/saju/types'
const color = OHAENG_COLOR[ohaeng]  // { bg, text, hex }

// ✅ Tailwind 유틸리티 (globals.css 정의)
<div className={`ohaeng-chip ohaeng-${ohaeng}`}>

// ❌ 하드코딩된 컬러 값
<div style={{ color: '#22c55e' }}>
```

## 성능 최적화

```tsx
// 불필요한 리렌더 방지
const memoizedPlaces = useMemo(
  () => places.filter(p => p.ohaeng.some(o => activeFilter.includes(o))),
  [places, activeFilter]
)

// 이벤트 핸들러 메모이제이션
const handleClick = useCallback((place: PlaceRow) => {
  openPlace(place)
}, [openPlace])
```

## iOS Safe Area

```tsx
// 바텀시트, 모달
<div className="pb-safe">

// 상단 고정 요소
<div className="pt-safe">
```

## 접근성 (a11y)

```tsx
// 인터랙티브 요소에 aria 속성
<button aria-label="바텀시트 닫기" onClick={onClose}>
<div role="dialog" aria-modal="true" aria-label="장소 상세정보">
```
