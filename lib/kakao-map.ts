/**
 * 카카오맵 SDK 타입 선언 + 헬퍼
 *
 * SDK는 autoload=false로 로드되므로,
 * 모든 접근은 kakao.maps.load() 콜백 내부에서 이뤄져야 함.
 */

// ─────────────────────────────────────────────
// Window 전역 타입 확장
// ─────────────────────────────────────────────
declare global {
  interface Window {
    kakao: KakaoMaps
  }
}

export interface KakaoMaps {
  maps: {
    load: (callback: () => void) => void
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay
    event: {
      addListener: (target: unknown, type: string, handler: () => void) => void
      removeListener: (target: unknown, type: string, handler: () => void) => void
    }
  }
}

export interface KakaoMapOptions {
  center: KakaoLatLng
  level: number
  mapTypeId?: unknown
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void
  setLevel: (level: number) => void
  getCenter: () => KakaoLatLng
  getLevel: () => number
  panTo: (latlng: KakaoLatLng) => void
  relayout: () => void
}

export interface KakaoLatLng {
  getLat: () => number
  getLng: () => number
}

export interface KakaoCustomOverlayOptions {
  position: KakaoLatLng
  content: string | HTMLElement
  map?: KakaoMap
  yAnchor?: number
  zIndex?: number
  clickable?: boolean
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void
  getMap: () => KakaoMap | null
  setPosition: (latlng: KakaoLatLng) => void
  setContent: (content: string | HTMLElement) => void
  setZIndex: (zIndex: number) => void
}

// ─────────────────────────────────────────────
// SDK 로드 유틸
// ─────────────────────────────────────────────

/** SDK가 이미 준비됐는지 확인 */
export function isKakaoReady(): boolean {
  return typeof window !== 'undefined' && !!window.kakao?.maps?.Map
}

/**
 * SDK 준비 완료 후 콜백 실행
 * - 이미 로드됐으면 즉시 실행
 * - 아직 로드 중이면 load() 콜백으로 실행
 */
export function withKakao(callback: () => void): void {
  if (typeof window === 'undefined') return

  if (isKakaoReady()) {
    callback()
    return
  }

  if (window.kakao?.maps) {
    window.kakao.maps.load(callback)
    return
  }

  // SDK 스크립트 로드 완료 이벤트 대기
  const scriptEl = document.querySelector<HTMLScriptElement>(
    'script[src*="dapi.kakao.com"]',
  )
  if (scriptEl) {
    scriptEl.addEventListener('load', () => {
      window.kakao.maps.load(callback)
    })
  }
}

// ─────────────────────────────────────────────
// 오행 마커 HTML 생성 헬퍼
// ─────────────────────────────────────────────

export type MarkerSize = 'lg' | 'md' | 'sm'

const MARKER_PX: Record<MarkerSize, number> = { lg: 52, md: 40, sm: 30 }

interface MarkerOptions {
  emoji: string
  color: string       // HEX (예: '#E8593C')
  size?: MarkerSize
  selected?: boolean
  label?: string      // 말풍선 라벨
}

/**
 * 카카오맵 CustomOverlay에 주입할 마커 HTML 문자열 생성
 * 오행별 색상 + 핀 드롭 모양 + 선택 시 확대 효과
 */
export function buildMarkerHTML(opts: MarkerOptions): string {
  const { emoji, color, size = 'md', selected = false, label } = opts
  const px = MARKER_PX[size] * (selected ? 1.3 : 1)
  const shadow = selected
    ? `0 4px 16px ${color}80`
    : '0 2px 6px rgba(0,0,0,0.25)'
  const border = selected ? '3px solid white' : '2px solid rgba(255,255,255,0.9)'
  const zIdx = selected ? 100 : 1

  return `
    <div
      data-marker="true"
      style="
        position:relative;
        cursor:pointer;
        z-index:${zIdx};
        filter:drop-shadow(${shadow});
        transition:transform 0.15s ease;
      "
    >
      <!-- 핀 드롭 모양 (45도 회전 정사각형) -->
      <div style="
        width:${px}px;
        height:${px}px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
        border:${border};
        box-sizing:border-box;
      ">
        <span style="
          transform:rotate(45deg);
          font-size:${Math.round(px * 0.42)}px;
          line-height:1;
          user-select:none;
        ">${emoji}</span>
      </div>
      <!-- 라벨 (선택 시만 표시) -->
      ${selected && label ? `
        <div style="
          position:absolute;
          top:calc(100% + 4px);
          left:50%;
          transform:translateX(-50%);
          background:white;
          color:#111;
          font-size:11px;
          font-weight:600;
          white-space:nowrap;
          padding:3px 8px;
          border-radius:8px;
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
        ">${label}</div>
      ` : ''}
    </div>
  `
}

// ─────────────────────────────────────────────
// 뷰포트 내 장소 필터링
// ─────────────────────────────────────────────
export function isInBounds(
  lat: number,
  lng: number,
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number },
): boolean {
  return (
    lat >= bounds.swLat &&
    lat <= bounds.neLat &&
    lng >= bounds.swLng &&
    lng <= bounds.neLng
  )
}
