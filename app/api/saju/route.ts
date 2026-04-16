/**
 * POST /api/saju
 *
 * Body: SajuInput { year, month, day, hour?, gender? }
 * 응답: SajuResult (오행 분석 + 4기둥 + 요약)
 *
 * 서버사이드 계산 → 결과를 user_profiles에 upsert (로그인 시)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateSaju } from '@/lib/saju/engine'
import type { SajuInput } from '@/lib/saju/types'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  const body = await req.json() as SajuInput

  // ── 입력 검증 ──
  const { year, month, day, hour, gender } = body
  if (!year || !month || !day) {
    return NextResponse.json(
      { error: '생년월일을 입력해주세요.' },
      { status: 400 },
    )
  }
  if (year < 1900 || year > new Date().getFullYear()) {
    return NextResponse.json(
      { error: '유효하지 않은 연도입니다.' },
      { status: 400 },
    )
  }

  // ── 사주 계산 ──
  const result = calculateSaju({ year, month, day, hour, gender })

  // ── DB 저장 (로그인 세션이 있을 때만) ──
  try {
    const cookieStore = cookies()
    // user_profiles는 JSONB 컬럼(ohaeng_analysis) 때문에 supabase-js v2 generic 우회
    // 실제 타입 안전성은 UserProfileRow로 유지
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('user_profiles').upsert({
        kakao_id: user.id,
        birth_year: year,
        birth_month: month,
        birth_day: day,
        birth_hour: hour ?? null,
        gender: gender ?? null,
        ohaeng_analysis: result.ohaengCount,
        weak_ohaeng: result.weakOhaeng,
        strong_ohaeng: result.strongOhaeng,
        imbalance_score: result.imbalanceScore,
      }, { onConflict: 'kakao_id' })
    }
  } catch {
    // 저장 실패는 silent — 계산 결과는 항상 반환
  }

  return NextResponse.json({ data: result })
}
