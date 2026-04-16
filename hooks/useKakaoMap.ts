/**
 * useKakaoMap — 카카오맵 인스턴스 초기화 훅
 *
 * 사용법:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   const { map, isReady } = useKakaoMap(containerRef, { lat: 37.5, lng: 127.0, level: 7 })
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { withKakao, type KakaoMap } from '@/lib/kakao-map'

interface UseKakaoMapOptions {
  lat: number
  lng: number
  level?: number          // 1(가장 확대) ~ 14(가장 축소), 기본 7
  onLoad?: (map: KakaoMap) => void
}

interface UseKakaoMapReturn {
  map: KakaoMap | null
  isReady: boolean
  /** 지도 중심 이동 */
  panTo: (lat: number, lng: number) => void
  /** 레이아웃 재계산 (패널 크기 변화 후 호출) */
  relayout: () => void
}

export function useKakaoMap(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseKakaoMapOptions,
  /** Mock 모드 등 SDK 초기화를 건너뛸 때 true */
  skip = false,
): UseKakaoMapReturn {
  const mapRef = useRef<KakaoMap | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // skip=true(DevMap 모드)면 SDK 초기화 생략
    if (skip || !containerRef.current) return

    withKakao(() => {
      if (!containerRef.current || mapRef.current) return
      const { kakao } = window
      const center = new kakao.maps.LatLng(options.lat, options.lng)
      const map = new kakao.maps.Map(containerRef.current, {
        center,
        level: options.level ?? 7,
      })
      mapRef.current = map
      setIsReady(true)
      options.onLoad?.(map)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip])

  const panTo = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return
    const latlng = new window.kakao.maps.LatLng(lat, lng)
    mapRef.current.panTo(latlng)
    mapRef.current.setLevel(4) // 장소 선택 시 확대
  }, [])

  const relayout = useCallback(() => {
    mapRef.current?.relayout()
  }, [])

  return { map: mapRef.current, isReady, panTo, relayout }
}
