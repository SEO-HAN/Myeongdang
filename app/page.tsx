/**
 * app/page.tsx — 지도 메인 페이지 (Server Component)
 *
 * Vercel/Next.js 베스트 프랙티스:
 *  1. Server Component에서 Supabase 직접 쿼리 (fetch 없이 DB 직접 접근)
 *  2. 초기 데이터를 props로 Client Component에 전달
 *  3. 지도·필터·바텀시트는 MapClient(Client Component)가 담당
 *  4. Suspense로 스트리밍 렌더링
 *
 * Mock 모드:
 *  NEXT_PUBLIC_MOCK_MODE=true 또는 Supabase 연결 실패 시
 *  lib/mock-data.ts의 30개 시드 데이터로 자동 fallback
 */
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'
import type { Database, PlaceRow } from '@/types/database'
import { MOCK_PLACES, isMockMode } from '@/lib/mock-data'
import MapClient from './MapClient'

export const metadata: Metadata = {
  title: '명당지도 — 내 사주에 맞는 풍수 명당',
}

// Vercel Edge Cache: 60초마다 재검증
export const revalidate = 60

async function fetchInitialPlaces(): Promise<PlaceRow[]> {
  // ── Mock 모드: Supabase 없이 로컬 시드 데이터 사용 ──
  if (isMockMode()) {
    console.info('[page] Mock 모드: 로컬 시드 데이터 30개 로드')
    return MOCK_PLACES
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
    )

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('trust_score', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[page] Supabase fetch error — Mock fallback 사용:', error.message)
      return MOCK_PLACES
    }
    return data ?? MOCK_PLACES
  } catch (err) {
    console.error('[page] fetch failed — Mock fallback 사용:', err)
    return MOCK_PLACES
  }
}

export default async function MapPage() {
  const places = await fetchInitialPlaces()

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500 font-medium">명당지도 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <MapClient initialPlaces={places} />
    </Suspense>
  )
}
