---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript / React 코딩 규칙

## 타입 안전성

- `any` 타입 **절대 금지** → `unknown` 또는 명시적 인터페이스 사용
- 외부 API 응답은 반드시 `types/database.ts` 또는 로컬 인터페이스로 타이핑
- `as` 타입 단언은 최후 수단 (불가피 시 `// @ts-expect-error` + 이유 주석)
- `!` non-null assertion은 null 불가능이 논리적으로 명확한 경우만

## Server / Client 컴포넌트 구분

```typescript
// Server Component (기본값) — 'use client' 없음
// 가능: async/await, 서버 데이터 fetch, generateMetadata
// 불가: useState, useEffect, 브라우저 API

// Client Component — 첫 줄에 반드시
'use client'
// 가능: useState, useEffect, 이벤트 핸들러
// 불가: 직접 DB 접근, 서버 시크릿 사용
```

## Next.js 14 App Router 패턴

```typescript
// ✅ Server Component에서 메타데이터 생성
export async function generateMetadata({ searchParams }): Promise<Metadata> { }

// ✅ API Route — 동적 렌더링 강제
export const dynamic = 'force-dynamic'

// ✅ 정적 경로에서 캐싱
export const revalidate = 60

// ✅ Client Component에서 Kakao Maps 로드
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })
```

## Import 규칙

```typescript
// 경로 별칭 사용 (@/ = 프로젝트 루트)
import { calculateSaju } from '@/lib/saju'    // ✅
import { calculateSaju } from '../../../lib/saju'  // ❌

// 타입 import 분리
import type { SajuResult } from '@/lib/saju'

// 외부 라이브러리 → 내부 모듈 순서
import { motion } from 'framer-motion'
import { calculateSaju } from '@/lib/saju'
import type { PlaceRow } from '@/types/database'
```

## 함수 & 컴포넌트 네이밍

```typescript
// React 컴포넌트: PascalCase
export default function PlaceBottomSheet() { }

// Hook: use 접두사
export function useKakaoMap(ref, opts) { }

// 유틸리티: camelCase
export function getOhaengHex(o: Ohaeng) { }

// 상수: SCREAMING_SNAKE_CASE
export const OHAENG_EMOJI = { ... }
```

## 오류 처리

```typescript
// API Route 응답 패턴
try {
  const data = await fetchSomething()
  return NextResponse.json({ data })
} catch (error) {
  console.error('[API 이름] 오류:', error)  // 한국어 컨텍스트
  return NextResponse.json(
    { error: '서버 오류가 발생했습니다' },
    { status: 500 }
  )
}
```

## Tailwind CSS

- 커스텀 클래스: `.ohaeng-mok`, `.ohaeng-hwa`, `.ohaeng-to`, `.ohaeng-geum`, `.ohaeng-su`
- 브랜드 컬러: `brand` = `#E8593C`
- safe area: `pb-safe`, `pt-safe` (iOS 노치 대응)
- 조건부 클래스: `clsx` + `tailwind-merge` via `cn()` 유틸

## 금지 패턴

```typescript
// ❌ console.log 프로덕션 코드 (debug는 console.error/warn만)
// ❌ useEffect 안에서 직접 Supabase 쿼리 (API Route 사용)
// ❌ 하드코딩된 한국어 문자열 (types.ts 상수 참조)
// ❌ import React from 'react' (Next.js 14 불필요)
```
