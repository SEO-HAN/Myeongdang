/**
 * KakaoMap — 지도 컨테이너 + 오행 CustomOverlay 마커
 *
 * 설계 원칙:
 *  - 마커 클릭 → useUserStore.openPlace() 로 바텀시트 트리거
 *  - 선택된 마커는 크기 확대 + 라벨 표시
 *  - 필터 변경 시 마커 set/unset만 (DOM 재생성 최소화)
 *  - 'use client' — SSR 에서 kakao 접근 불가
 *
 * Mock 모드:
 *  Kakao SDK 로드 실패(MOCK_KEY_FOR_DEV) 시 DevMap으로 자동 전환
 *  마커 클릭 → 바텀시트 등 모든 인터랙션은 DevMap에서도 동작
 */
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useUserStore, useSelectedPlace } from '@/store/user-store'
import {
  buildMarkerHTML,
  withKakao,
  type KakaoCustomOverlay,
  type MarkerSize,
} from '@/lib/kakao-map'
import { OHAENG_COLOR, OHAENG_EMOJI } from '@/lib/saju/types'
import { getTrustMarkerSize } from '@/lib/utils'
import type { PlaceRow } from '@/types/database'
import type { Ohaeng } from '@/lib/saju/types'

interface KakaoMapProps {
  /** 현재 필터된 장소 목록 */
  places: PlaceRow[]
  /** 전체 장소 목록 (마커 초기화용) */
  className?: string
}

/** 마커 인스턴스 캐시 (place.id → overlay) */
type OverlayMap = Map<string, KakaoCustomOverlay>

// ─────────────────────────────────────────────
// DevMap — Kakao SDK 없이 동작하는 개발용 지도
// 실제 좌표 → 뷰포트 픽셀 변환 (서울 중심 기준)
// ─────────────────────────────────────────────
const OHAENG_LABEL: Record<string, string> = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' }

function DevMap({ places, className = '' }: KakaoMapProps) {
  const openPlace = useUserStore((s) => s.openPlace)
  const { place: selectedPlace } = useSelectedPlace()

  // 서울 중심 좌표 기준 픽셀 변환 (간이 Mercator)
  const toPixel = (lat: number, lng: number) => {
    const centerLat = 36.5, centerLng = 127.8
    const scaleX = 380, scaleY = 480
    const x = ((lng - centerLng) / 5.5) * scaleX + 50
    const y = ((centerLat - lat) / 5.0) * scaleY + 60
    return { x: Math.max(12, Math.min(340, x)), y: Math.max(30, Math.min(560, y)) }
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#E8F0E3] ${className}`}>
      {/* 개발 모드 배지 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm pointer-events-none">
        🛠 Dev Map — Kakao SDK 없이 실행 중
      </div>

      {/* 배경 지형 */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 390 812" preserveAspectRatio="none">
        {/* 한강 */}
        <path d="M0,370 Q100,355 200,365 Q300,375 390,360" stroke="#7EB3E8" strokeWidth="18" fill="none" opacity="0.8"/>
        {/* 도로망 */}
        <line x1="195" y1="0" x2="195" y2="812" stroke="#F0EAD8" strokeWidth="5" opacity="0.6"/>
        <line x1="0" y1="330" x2="390" y2="330" stroke="#F0EAD8" strokeWidth="5" opacity="0.6"/>
        <line x1="0" y1="500" x2="390" y2="500" stroke="#F0EAD8" strokeWidth="3" opacity="0.4"/>
        <line x1="120" y1="0" x2="120" y2="812" stroke="#F0EAD8" strokeWidth="3" opacity="0.4"/>
        <line x1="270" y1="0" x2="270" y2="812" stroke="#F0EAD8" strokeWidth="3" opacity="0.4"/>
      </svg>

      {/* 장소 마커들 */}
      {places.map((place) => {
        const { x, y } = toPixel(place.lat, place.lng)
        const primaryOhaeng = (place.ohaeng[0] ?? '목') as Ohaeng
        const color = OHAENG_COLOR[primaryOhaeng]?.hex ?? '#888'
        const emoji = OHAENG_EMOJI[primaryOhaeng] ?? '📍'
        const isSelected = selectedPlace?.id === place.id
        const size = getTrustMarkerSize(place.trust_score)
        const px = size === 'lg' ? 44 : size === 'md' ? 34 : 26

        return (
          <button
            key={place.id}
            onClick={() => openPlace(place)}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -100%) ${isSelected ? 'scale(1.25)' : 'scale(1)'}`,
              zIndex: isSelected ? 50 : place.trust_score,
              transition: 'transform 0.15s ease',
            }}
            className="flex flex-col items-center group"
            aria-label={place.name}
          >
            {/* 핀 마커 */}
            <div
              style={{
                width: px, height: px,
                background: color,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                border: isSelected ? '2.5px solid white' : '1.5px solid rgba(255,255,255,0.8)',
                boxShadow: isSelected ? `0 4px 14px ${color}80` : '0 2px 6px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ transform: 'rotate(45deg)', fontSize: Math.round(px * 0.44), lineHeight: 1 }}>
                {emoji}
              </span>
            </div>
            {/* 선택 시 라벨 */}
            {isSelected && (
              <div className="absolute top-full mt-1 bg-white text-gray-900 text-[11px] font-semibold whitespace-nowrap px-2 py-0.5 rounded-lg shadow-card pointer-events-none">
                {place.name}
              </div>
            )}
          </button>
        )
      })}

      {/* 장소 수 뱃지 */}
      <div className="absolute top-8 right-3 bg-white rounded-full px-3 py-1.5 shadow-card text-xs font-medium text-gray-600 pointer-events-none">
        명당 {places.length}곳
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SDK 로드 가능 여부 판단
// ─────────────────────────────────────────────
function isKakaoKeyMock(): boolean {
  return (
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY === 'MOCK_KEY_FOR_DEV' ||
    !process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
  )
}

export default function KakaoMap({ places, className = '' }: KakaoMapProps) {
  const [sdkFailed, setSdkFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlaysRef = useRef<OverlayMap>(new Map())

  // Mock 키라면 SDK 로드를 시도하지 않고 즉시 DevMap 렌더
  const skipKakao = isKakaoKeyMock()

  const { map, isReady, panTo } = useKakaoMap(containerRef, {
    lat: 37.5665,
    lng: 126.9780,
    level: 8, // 서울 전체가 보이는 줌 레벨
  }, skipKakao)

  const openPlace = useUserStore((s) => s.openPlace)
  const { place: selectedPlace } = useSelectedPlace()

  // ── 마커 클릭 핸들러 생성 ──────────────────
  const makeClickHandler = useCallback(
    (place: PlaceRow) => () => {
      openPlace(place)
      panTo(place.lat, place.lng)
    },
    [openPlace, panTo],
  )

  // ── 단일 마커 생성 ─────────────────────────
  const createOverlay = useCallback(
    (place: PlaceRow, kakaoMap: unknown, selected: boolean) => {
      const { kakao } = window
      const primaryOhaeng = place.ohaeng[0] as Ohaeng
      const color = OHAENG_COLOR[primaryOhaeng]?.hex ?? '#888'
      const emoji = OHAENG_EMOJI[primaryOhaeng] ?? '📍'
      const size: MarkerSize = getTrustMarkerSize(place.trust_score)

      const html = buildMarkerHTML({
        emoji,
        color,
        size,
        selected,
        label: selected ? place.name : undefined,
      })

      // DOM 컨테이너 생성 후 이벤트 바인딩 (innerHTML XSS 방지 불필요 — 내부 데이터)
      const container = document.createElement('div')
      container.innerHTML = html
      container.style.cssText = 'position:relative;'
      container.addEventListener('click', makeClickHandler(place))

      const latlng = new kakao.maps.LatLng(place.lat, place.lng)
      const overlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: container,
        map: kakaoMap as never,
        yAnchor: 1.05,
        zIndex: selected ? 100 : place.trust_score,
        clickable: true,
      })
      return overlay
    },
    [makeClickHandler],
  )

  // ── 마커 전체 리렌더 (places 또는 선택 상태 변경 시) ──
  useEffect(() => {
    if (!isReady || !map) return

    withKakao(() => {
      const kakaoMap = map
      const currentIds = new Set(places.map((p) => p.id))
      const existingIds = new Set(overlaysRef.current.keys())

      // 1. 사라진 장소 마커 제거
      existingIds.forEach((id) => {
        if (!currentIds.has(id)) {
          overlaysRef.current.get(id)?.setMap(null)
          overlaysRef.current.delete(id)
        }
      })

      // 2. 새 장소 마커 추가 + 선택 상태 반영
      places.forEach((place) => {
        const isSelected = selectedPlace?.id === place.id
        const existing = overlaysRef.current.get(place.id)

        if (existing) {
          // 선택 상태만 변경 (HTML 재생성)
          const primaryOhaeng = place.ohaeng[0] as Ohaeng
          const color = OHAENG_COLOR[primaryOhaeng]?.hex ?? '#888'
          const emoji = OHAENG_EMOJI[primaryOhaeng] ?? '📍'
          const size: MarkerSize = getTrustMarkerSize(place.trust_score)
          const html = buildMarkerHTML({
            emoji, color, size,
            selected: isSelected,
            label: isSelected ? place.name : undefined,
          })
          const newContainer = document.createElement('div')
          newContainer.innerHTML = html
          newContainer.addEventListener('click', makeClickHandler(place))
          existing.setContent(newContainer)
          existing.setZIndex(isSelected ? 100 : place.trust_score)
        } else {
          // 새 마커 생성
          const overlay = createOverlay(place, kakaoMap, isSelected)
          overlaysRef.current.set(place.id, overlay)
        }
      })
    })
  }, [isReady, map, places, selectedPlace, createOverlay, makeClickHandler])

  // ── 언마운트 시 마커 정리 ──────────────────
  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null))
      overlaysRef.current.clear()
    }
  }, [])

  // Mock 키 또는 SDK 로드 실패 → DevMap 렌더
  if (skipKakao || sdkFailed) {
    return <DevMap places={places} className={className} />
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 스켈레톤 */}
      {!isReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">지도를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 장소 수 뱃지 */}
      {isReady && (
        <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1.5 shadow-card text-xs font-medium text-gray-600 pointer-events-none">
          명당 {places.length}곳
        </div>
      )}
    </div>
  )
}
