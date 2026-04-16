/**
 * GET /api/recommend
 *
 * 사주 기반 개인화 장소 추천 (C5 업데이트: rankPlaces 점수 로직 적용)
 * 쿼리: ?y=1990&m=7&d=15&h=10&luck=재물운
 *
 * 응답: { result: SajuResult, recommendations: ScoredPlace[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateSaju } from '@/lib/saju/engine'
import { rankPlaces } from '@/lib/saju/recommend'
import { MOCK_PLACES, isMockMode } from '@/lib/mock-data'
import type { Database } from '@/types/database'
import type { PlaceRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year  = parseInt(searchParams.get('y') ?? '0')
  const month = parseInt(searchParams.get('m') ?? '0')
  const day   = parseInt(searchParams.get('d') ?? '0')
  const hour  = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined
  const luckPref = searchParams.get('luck') ?? undefined

  if (!year || !month || !day) {
    return NextResponse.json({ error: '생년월일 필수 (y, m, d 파라미터)' }, { status: 400 })
  }

  try {
    const result = calculateSaju({ year, month, day, hour })

    let places: PlaceRow[] = []

    if (isMockMode()) {
      places = MOCK_PLACES
    } else {
      try {
        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
        )
        const { data } = await supabase
          .from('places')
          .select('*')
          .order('trust_score', { ascending: false })
          .limit(50)
        places = data ?? MOCK_PLACES
      } catch {
        // Supabase 연결 실패 시 mock 데이터로 폴백
        places = MOCK_PLACES
      }
    }

    const ranked = rankPlaces(places, result, luckPref).slice(0, 6)

    return NextResponse.json({
      result,
      recommendations: ranked,
    })
  } catch (error) {
    console.error('[recommend] 오류:', error)
    return NextResponse.json({ error: '추천 계산 실패' }, { status: 500 })
  }
}
