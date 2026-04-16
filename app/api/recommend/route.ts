/**
 * GET /api/recommend
 *
 * 사주 기반 개인화 장소 추천
 * 쿼리: ?weak=화,목&limit=10
 *
 * 응답: { data: PlaceRow[], reason: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Ohaeng } from '@/lib/saju/types'
import type { Database } from '@/types/database'
import { OHAENG_LUCK } from '@/lib/saju/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const weakRaw = searchParams.get('weak')
  const limit   = Math.min(Number(searchParams.get('limit') ?? 10), 50)

  if (!weakRaw) {
    return NextResponse.json({ error: 'weak 파라미터가 필요합니다.' }, { status: 400 })
  }

  const weakOhaeng = weakRaw.split(',').filter(Boolean) as Ohaeng[]
  const luckTypes  = Array.from(new Set(weakOhaeng.flatMap((o) => OHAENG_LUCK[o])))

  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )

  // 부족 오행과 겹치는 장소를 trust_score 내림차순으로
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .overlaps('ohaeng', weakOhaeng)
    .order('trust_score', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reason = `${weakOhaeng.join(', ')} 기운을 보충할 수 있는 명당 ${data?.length ?? 0}곳을 추천합니다.`

  return NextResponse.json({ data, reason, luckTypes })
}
