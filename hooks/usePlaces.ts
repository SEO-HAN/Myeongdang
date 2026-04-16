/**
 * usePlaces — 장소 데이터 페칭 + 클라이언트 필터링
 *
 * 전략:
 *  - 초기 로드: 서버에서 SSR로 전체 장소 props 전달 (빠른 초기 렌더링)
 *  - 필터 변경: 이미 로드된 데이터를 클라이언트에서 필터링 (API 재호출 없음)
 *  - 장소 30개 수준에서는 클라이언트 필터링이 빠르고 심플
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useActiveFilter, useUserStore } from '@/store/user-store'
import type { PlaceRow } from '@/types/database'
import type { Ohaeng } from '@/lib/saju/types'

interface UsePlacesOptions {
  /** 서버에서 받은 초기 장소 목록 */
  initialPlaces: PlaceRow[]
}

interface UsePlacesReturn {
  /** 현재 필터가 적용된 장소 목록 */
  places: PlaceRow[]
  /** 전체 장소 수 */
  total: number
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 */
  error: string | null
  /** 추가 장소 로드 (향후 페이지네이션용) */
  loadMore: () => void
}

export function usePlaces({ initialPlaces }: UsePlacesOptions): UsePlacesReturn {
  const [allPlaces] = useState<PlaceRow[]>(initialPlaces)
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)

  const activeFilter = useActiveFilter()

  // 클라이언트 오행 필터링 — 빈 배열이면 전체 표시
  const places = useMemo(() => {
    if (activeFilter.length === 0) return allPlaces
    return allPlaces.filter((p) =>
      p.ohaeng.some((o) => activeFilter.includes(o as Ohaeng)),
    )
  }, [allPlaces, activeFilter])

  const loadMore = () => {
    // Phase 2: 페이지네이션 구현
    console.log('loadMore — Phase 2에서 구현')
  }

  return {
    places,
    total: allPlaces.length,
    isLoading,
    error,
    loadMore,
  }
}

/**
 * 장소 ID로 단일 장소 조회 (바텀시트 상세용)
 */
export function usePlaceById(placeId: string | null, allPlaces: PlaceRow[]) {
  return useMemo(() => {
    if (!placeId) return null
    return allPlaces.find((p) => p.id === placeId) ?? null
  }, [placeId, allPlaces])
}
