/**
 * MapClient — 지도 UI 전체 담당 Client Component
 *
 * Server Component(page.tsx)에서 초기 데이터를 받아
 * 지도·필터·바텀시트를 렌더링함.
 *
 * Zustand hydration:
 *  persist(skipHydration:true) → useEffect에서 수동 rehydrate
 *  → SSR mismatch 없이 localStorage 복원
 */
'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/user-store'
import { usePlaces } from '@/hooks/usePlaces'
import OhaengFilterBar from '@/components/map/OhaengFilterBar'
import PersonalizationBanner from '@/components/map/PersonalizationBanner'
import PlaceBottomSheet from '@/components/map/PlaceBottomSheet'
import IlshinBanner from '@/components/saju/IlshinBanner'
import type { PlaceRow } from '@/types/database'

// KakaoMap은 window 접근 필요 → dynamic import로 SSR 완전 비활성화
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse" />
  ),
})

interface MapClientProps {
  initialPlaces: PlaceRow[]
}

export default function MapClient({ initialPlaces }: MapClientProps) {
  // Zustand hydration (skipHydration: true 설정이므로 수동 실행)
  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  // 클라이언트 필터링 (API 재호출 없이 메모이즈드)
  const { places } = usePlaces({ initialPlaces })

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-gray-50">

      {/* 지도 영역 — 전체 화면 */}
      <div className="relative flex-1 overflow-hidden">
        {/* 오행 필터바 (지도 위 오버레이) */}
        <OhaengFilterBar />

        {/* 카카오맵 */}
        <KakaoMap places={places} className="w-full h-full" />

        {/* 일진(日辰) 개운 배너 — 사주 입력 유저에게만 표시 */}
        <IlshinBanner variant="overlay" />

        {/* 사주 미입력 유저 유도 배너 */}
        <PersonalizationBanner />
      </div>

      {/* 장소 상세 바텀시트 */}
      <PlaceBottomSheet />
    </main>
  )
}
