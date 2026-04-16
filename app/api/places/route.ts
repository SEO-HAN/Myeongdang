/**
 * GET /api/places
 *
 * 쿼리 파라미터:
 *  ?ohaeng=화,수        → 오행 필터 (복수 가능)
 *  ?luck=사업운         → 운 유형 필터
 *  ?type=산             → 장소 유형 필터
 *  ?limit=20            → 결과 수 (기본 50)
 *  ?trending=true       → 트렌딩 순 정렬
 *
 * 응답: { data: PlaceRow[], count: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { MOCK_PLACES, isMockMode } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ohaeng  = searchParams.get('ohaeng')?.split(',').filter(Boolean) ?? []
  const luck    = searchParams.get('luck')
  const type    = searchParams.get('type')
  const limit   = Math.min(Number(searchParams.get('limit') ?? 50), 200)
  const trending = searchParams.get('trending') === 'true'

  // ── Mock 모드: 로컬 데이터로 필터링 ──────────────────────────────
  if (isMockMode()) {
    let filtered = [...MOCK_PLACES]
    if (ohaeng.length > 0) {
      filtered = filtered.filter((p) => p.ohaeng.some((o) => ohaeng.includes(o)))
    }
    if (luck) {
      filtered = filtered.filter((p) => p.luck_types.includes(luck))
    }
    if (type) {
      filtered = filtered.filter((p) => p.place_type === type)
    }
    filtered.sort((a, b) =>
      trending ? b.trending_score - a.trending_score : b.trust_score - a.trust_score
    )
    const result = filtered.slice(0, limit)
    return NextResponse.json({ data: result, count: result.length })
  }

  // ── 실 Supabase 쿼리 ─────────────────────────────────────────────
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )

  let query = supabase
    .from('places')
    .select('*, place_contents(id, sns_type, sns_url, sns_author, snippet_text)')
    .order(trending ? 'trending_score' : 'trust_score', { ascending: false })
    .limit(limit)

  if (ohaeng.length > 0) {
    query = query.overlaps('ohaeng', ohaeng)
  }
  if (luck) {
    query = query.contains('luck_types', [luck])
  }
  if (type) {
    query = query.eq('place_type', type)
  }

  const { data, error } = await query

  if (error) {
    // Supabase 오류 시 Mock fallback
    console.error('[/api/places] Supabase 오류 — Mock fallback:', error.message)
    return NextResponse.json({ data: MOCK_PLACES.slice(0, limit), count: MOCK_PLACES.length })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 })
}
