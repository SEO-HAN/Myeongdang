---
paths:
  - "app/api/**/*.ts"
---

# API Route Handler 규칙

## 필수 선언

```typescript
// 모든 Route Handler 상단에 필수
export const dynamic = 'force-dynamic'
// 이유: Supabase 쿼리는 항상 최신 데이터 반환 필요
```

## Supabase 클라이언트 — Route Handler 패턴

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )
  // ...
}
```

## 관리 작업에는 Service Role Key 사용

```typescript
// 관리 작업 (RLS 우회 필요 시)
import { createClient } from '@supabase/supabase-js'
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ⚠️ 서버 전용
)
// ❌ SUPABASE_SERVICE_ROLE_KEY는 절대 NEXT_PUBLIC_으로 노출 금지
```

## 쿼리 파라미터 파싱

```typescript
const { searchParams } = request.nextUrl

// 오행 배열 파싱
const ohaengParam = searchParams.get('ohaeng')
const ohaeng = ohaengParam ? ohaengParam.split(',') : []

// 숫자 파싱 (NaN 방어)
const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

// 부울 파싱
const trending = searchParams.get('trending') === 'true'
```

## Supabase 배열 오버랩 쿼리

```typescript
// ohaeng 배열 겹치는 장소 조회
if (ohaeng.length > 0) {
  query = query.overlaps('ohaeng', ohaeng)
}

// 배열 포함 조회 (정확히 포함)
query = query.contains('luck_types', ['사업운'])
```

## 응답 형식

```typescript
// 성공
return NextResponse.json({ data, total, reason })

// 오류 — 한국어 메시지
return NextResponse.json(
  { error: '잘못된 요청입니다', details: '연도는 1900~현재 사이여야 합니다' },
  { status: 400 }
)

// 404
return NextResponse.json({ error: '장소를 찾을 수 없습니다' }, { status: 404 })
```

## OG 이미지 API 특이사항

```typescript
// app/api/og/route.ts 전용
export const runtime = 'edge'  // Edge 런타임
export const revalidate = 86400  // 24시간 캐싱
// ImageResponse 사용 — JSX 반환
```

## 입력 검증 체크리스트

- [ ] year: 1900 ≤ year ≤ currentYear
- [ ] month: 1~12
- [ ] day: 1~31 (월별 최대일 체크)
- [ ] hour: 0~23 또는 undefined
- [ ] 오행값: ['목','화','토','금','수'] 중 하나인지 검증
