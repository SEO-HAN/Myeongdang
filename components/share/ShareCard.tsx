/**
 * ShareCard — Canvas API 공유 이미지 생성 + 카카오톡 공유
 *
 * 생성 이미지 구성 (1080×1080):
 *   ┌─────────────────────────┐
 *   │  명당지도               │  (브랜드 헤더)
 *   │                         │
 *   │  나는 🔥 화가 부족한    │  (대형 타이포)
 *   │  사람입니다              │
 *   │                         │
 *   │  [오행 레이더 차트 SVG] │  (중앙 시각화)
 *   │                         │
 *   │  부족 오행: 🔥화 💧수   │
 *   │  추천 명당: 관악산 외   │
 *   │                         │
 *   │  myeongdang.kr          │  (CTA)
 *   └─────────────────────────┘
 */
'use client'

import { useCallback, useRef } from 'react'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'

const CARD_SIZE = 1080

// ─────────────────────────────────────────────
// Canvas 드로잉 헬퍼
// ─────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

/** 오행 레이더 차트를 Canvas에 직접 그리기 */
function drawRadar(
  ctx: CanvasRenderingContext2D,
  strength: Record<Ohaeng, number>,
  cx: number, cy: number, maxR: number,
) {
  const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수']

  function vertex(idx: number, r: number) {
    const angle = (-90 + idx * 72) * (Math.PI / 180)
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  // 그리드 (5단계)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath()
    OHAENG_ORDER.forEach((_, i) => {
      const v = vertex(i, (maxR * level) / 5)
      i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)
    })
    ctx.closePath()
    ctx.stroke()
  }

  // 축
  OHAENG_ORDER.forEach((_, i) => {
    const v = vertex(i, maxR)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(v.x, v.y)
    ctx.stroke()
  })

  // 데이터 폴리곤 채우기
  ctx.beginPath()
  OHAENG_ORDER.forEach((o, i) => {
    const r = (strength[o] / 100) * maxR
    const v = vertex(i, r)
    i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgba(232,89,60,0.35)'
  ctx.fill()
  ctx.strokeStyle = '#E8593C'
  ctx.lineWidth = 3
  ctx.stroke()

  // 꼭짓점 점 + 레이블
  OHAENG_ORDER.forEach((o, i) => {
    const r = (strength[o] / 100) * maxR
    const v = vertex(i, r)
    const hex = OHAENG_COLOR[o].hex
    const [r2, g2, b2] = hexToRgb(hex)
    ctx.beginPath()
    ctx.arc(v.x, v.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${r2},${g2},${b2})`
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()

    // 레이블
    const lv = vertex(i, maxR + 38)
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${OHAENG_EMOJI[o]} ${o}`, lv.x, lv.y)
  })
}

// ─────────────────────────────────────────────
// 공유 이미지 생성 훅
// ─────────────────────────────────────────────

export function useShareCard() {
  const generateImage = useCallback(
    (result: SajuResult): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        canvas.width  = CARD_SIZE
        canvas.height = CARD_SIZE
        const ctx = canvas.getContext('2d')!

        // ── 오행별 배경 그라디언트 ──
        const primaryWeak = result.weakOhaeng[0] as Ohaeng
        const OHAENG_HEX_MAP: Record<string, string> = {
          목: '#4B7D1F', 화: '#D94F2A', 토: '#C17D2A', 금: '#9E9A8E', 수: '#2563EB',
        }
        const accentHex = OHAENG_HEX_MAP[primaryWeak] ?? '#E8593C'
        const [ar, ag, ab] = hexToRgb(accentHex)

        const bg = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE)
        bg.addColorStop(0, '#0D0D1A')
        bg.addColorStop(0.5, '#131230')
        bg.addColorStop(1, `rgba(${ar},${ag},${ab},0.25)`)
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE)

        // ── 오행 색 장식 원 ──
        ctx.beginPath()
        ctx.arc(CARD_SIZE * 0.85, CARD_SIZE * 0.15, 350, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${ar},${ag},${ab},0.10)`
        ctx.fill()

        // ── 브랜드 헤더 ──
        ctx.font = 'bold 52px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText('명당지도 · 明堂地圖', CARD_SIZE / 2, 120)

        // ── 메인 카피 (이름 표시) ──
        const name = (result.input as unknown as Record<string, unknown>).name as string | undefined
        const nameLine = name ? `${name}님은` : '나는'
        const weakEmoji = OHAENG_EMOJI[result.weakOhaeng[0]]
        const weakLabel = result.weakOhaeng.map(o => `${OHAENG_EMOJI[o]}${o}`).join(' ')

        ctx.font = 'bold 64px sans-serif'
        ctx.fillStyle = '#F0EAD8'
        ctx.fillText(nameLine, CARD_SIZE / 2, 200)

        ctx.font = 'bold 80px sans-serif'
        ctx.fillStyle = accentHex
        ctx.fillText(`${weakEmoji} ${result.weakOhaeng[0]} 기운이`, CARD_SIZE / 2, 300)

        ctx.font = 'bold 64px sans-serif'
        ctx.fillStyle = '#F0EAD8'
        ctx.fillText('부족한 사주예요', CARD_SIZE / 2, 390)

        // ── 레이더 차트 ──
        drawRadar(ctx, result.ohaengStrength, CARD_SIZE / 2, 620, 210)

        // ── 하단 분리선 ──
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(80, 860)
        ctx.lineTo(CARD_SIZE - 80, 860)
        ctx.stroke()

        // ── 부족 오행 요약 ──
        ctx.font = '40px sans-serif'
        ctx.fillStyle = 'rgba(240,234,216,0.7)'
        ctx.fillText(`부족 오행: ${weakLabel}`, CARD_SIZE / 2, 930)

        // ── CTA 버튼 ──
        const btnX = CARD_SIZE / 2 - 240
        ctx.beginPath()
        ctx.roundRect(btnX, 980, 480, 88, 44)
        ctx.fillStyle = accentHex
        ctx.fill()

        ctx.font = 'bold 42px sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.fillText('내 명당 찾기 → myeongdang.kr', CARD_SIZE / 2, 1034)

        resolve(canvas.toDataURL('image/png', 0.95))
      })
    },
    [],
  )

  return { generateImage }
}

// ─────────────────────────────────────────────
// 공유 UI 컴포넌트
// ─────────────────────────────────────────────

interface ShareCardButtonProps {
  result: SajuResult
  className?: string
}

export default function ShareCardButton({ result, className = '' }: ShareCardButtonProps) {
  const { generateImage } = useShareCard()
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage(result)
    if (linkRef.current) {
      linkRef.current.href = dataUrl
      linkRef.current.download = `명당지도_오행분석_${result.pillars.year.label}.png`
      linkRef.current.click()
    }
  }, [generateImage, result])

  const handleKakaoShare = useCallback(async () => {
    const dataUrl = await generateImage(result)
    const weakLabels = result.weakOhaeng.map((o) => `${OHAENG_EMOJI[o]}${o}`).join('+')
    const url = `${window.location.origin}/result?y=${result.input.year}&m=${result.input.month}&d=${result.input.day}${result.input.hour !== undefined ? `&h=${result.input.hour}` : ''}`

    if (typeof window !== 'undefined' && (window as any).Kakao?.isInitialized?.()) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `나는 ${result.weakOhaeng.map((o) => `${OHAENG_EMOJI[o]}${o}`).join(', ')}가 부족한 사람 — 명당지도`,
          description: result.summary.slice(0, 60),
          imageUrl: `${window.location.origin}/og-image.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          { title: '내 오행도 분석하기', link: { mobileWebUrl: url, webUrl: url } },
        ],
      })
    } else {
      // 폴백: 이미지 다운로드
      await handleDownload()
    }
  }, [generateImage, result, handleDownload])

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* 숨겨진 다운로드 링크 */}
      <a ref={linkRef} className="hidden" />

      {/* 카카오톡 공유 */}
      <button
        onClick={handleKakaoShare}
        className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-bold text-sm hover:bg-[#FDD800] transition-colors shadow-md"
      >
        <span className="text-lg">💬</span>
        카카오톡으로 공유
      </button>

      {/* 이미지 저장 */}
      <button
        onClick={handleDownload}
        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-colors"
      >
        ⬇️ 저장
      </button>
    </div>
  )
}
