---
paths:
  - "app/**"
  - "components/**"
  - "lib/**"
---

# 성능 최적화 규칙

<!-- 담당 에이전트: DevEngineer Agent — 전 Phase -->

## Core Web Vitals 목표

| 지표 | 목표 | 측정 도구 |
|------|------|-----------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse / Vercel Analytics |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| FID / INP (Interaction to Next Paint) | < 100ms | Chrome UX Report |
| TTFB (Time to First Byte) | < 600ms | Vercel Edge Network |

---

## Next.js App Router 성능 패턴

```typescript
// ✅ Server Component 기본 — 클라이언트 번들 최소화
// ✅ revalidate=60: 지도 데이터 (1분 캐시)
export const revalidate = 60

// ✅ 동적 import — 지도 컴포넌트 (첫 화면 번들 제외)
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

// ✅ 이미지 최적화
<Image
  src={place.image_url}
  alt={place.name}
  width={400}
  height={300}
  priority={isAboveFold}  // 첫 화면 이미지만 priority
  placeholder="blur"
  blurDataURL={place.blur_data_url}
/>

// ❌ 큰 라이브러리 전체 import 금지
import * as _ from 'lodash'  // ❌
import debounce from 'lodash/debounce'  // ✅
```

---

## 카카오 지도 성능

```typescript
// ✅ 오버레이 DOM 재활용 (기존 마커 재사용)
const overlayMap = useRef<Map<string, KakaoCustomOverlay>>(new Map())

// places 변경 시 처리 순서:
// 1. 사라진 place: overlay.setMap(null) → Map에서 제거
// 2. 유지되는 place: overlay.setContent(새 HTML) — DOM 유지
// 3. 새 place: createOverlay() → Map에 추가

// ✅ 마커 클러스터링 (50개+ 장소 시)
// ✅ 지도 이동 후 viewport 내 마커만 렌더링
// ❌ places 변경마다 전체 마커 재생성 금지 (심각한 성능 저하)
```

---

## Zustand 리렌더링 최적화

```typescript
// ✅ 편의 셀렉터 사용
const selectedPlace = useSelectedPlace()  // 해당 값 변경 시만 리렌더
const saju = useSajuResult()

// ✅ 액션은 전체 구독 허용
const { openPlace, setSaju } = useUserStore()

// ❌ 전체 스토어 구독 금지 (불필요한 리렌더 유발)
const store = useUserStore()  // 모든 상태 변경에 반응
```

---

## 번들 크기 관리

```bash
# 번들 분석
npm run build && npx @next/bundle-analyzer

# 목표:
# First Load JS < 150kb (shared chunks 포함)
# 각 페이지별 JS < 50kb

# ✅ framer-motion — LazyMotion으로 필요한 것만 로드
import { LazyMotion, domAnimation, m } from 'framer-motion'
// features: domAnimation (드래그, 스크롤 필요 시 domMax)
```

---

## API 응답 최적화

```typescript
// ✅ places API — 필드 선택 (불필요한 데이터 제외)
const { data } = await supabase
  .from('places')
  .select('id, name, ohaeng, luck_types, lat, lng, trust_score, reason_text')
  .limit(50)

// ✅ 페이지네이션 — 한번에 최대 50개
// ✅ 오행 필터 → DB 쿼리 레벨에서 처리 (클라이언트 필터링 금지)

// ✅ 사주 계산 — 서버사이드 캐시 (동일 입력 = 동일 결과)
// searchParams 기반 URL 캐싱 활용
```

---

## 모바일 성능 특이사항

```
✅ 터치 이벤트 passive: true (스크롤 성능)
✅ 이미지 WebP/AVIF 포맷 (next/image 자동 변환)
✅ 폰트 font-display: swap (텍스트 즉시 표시)
✅ CSS 애니메이션 — GPU 가속 (transform/opacity만)
❌ layout/paint 유발 CSS 속성 애니메이션 금지 (top, width, height)
❌ 스크롤 이벤트 핸들러 직접 부착 금지 → IntersectionObserver 사용
```

---

## 성능 모니터링

```typescript
// Vercel Analytics 연동 (Phase D)
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// 사주 계산 성능 측정
const start = performance.now()
const result = calculateSaju(input)
console.debug(`사주 계산: ${(performance.now() - start).toFixed(2)}ms`)
// 목표: < 50ms

// Web Vitals 리포팅
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('LCP 목표 초과:', metric.value)
  }
}
```
