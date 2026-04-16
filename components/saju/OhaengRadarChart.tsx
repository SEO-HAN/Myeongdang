/**
 * OhaengRadarChart — 오행 강도 5각형 레이더 차트 (순수 SVG)
 *
 * - 외부 라이브러리 없음 (번들 사이즈 0 추가)
 * - framer-motion path 애니메이션으로 채워지는 효과
 * - 오행별 색상 레이블 + 강도 퍼센트 표시
 * - 공유 카드 Canvas 렌더링용 ref 지원
 */
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수']

// 5각형: 꼭짓점 위치 (위쪽 꼭짓점부터 시계 방향)
// 각도: -90°(목), 90°-72°=18°(화), 18°+72°=90°(토), 162°(금), 234°(수)  ← 시계 방향 72° 간격
function getVertices(cx: number, cy: number, r: number) {
  return OHAENG_ORDER.map((_, i) => {
    const angle = (-90 + i * 72) * (Math.PI / 180)
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

function toPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
}

interface OhaengRadarChartProps {
  /** 오행 강도 (0~100) */
  strength: Record<Ohaeng, number>
  size?: number
  className?: string
  /** 레이블 표시 여부 */
  showLabels?: boolean
  /** 강도 숫자 표시 여부 */
  showValues?: boolean
  /** 애니메이션 비활성화 (Canvas 캡처용) */
  noAnimation?: boolean
}

export default function OhaengRadarChart({
  strength,
  size = 240,
  className = '',
  showLabels = true,
  showValues = false,
  noAnimation = false,
}: OhaengRadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36 // 전체 반지름

  // 5단계 그리드 (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  // 꼭짓점 (최대치 기준)
  const outerVertices = useMemo(() => getVertices(cx, cy, maxR), [cx, cy, maxR])

  // 데이터 폴리곤 꼭짓점
  const dataVertices = useMemo(
    () =>
      OHAENG_ORDER.map((o, i) => {
        const r = (strength[o] / 100) * maxR
        const angle = (-90 + i * 72) * (Math.PI / 180)
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
      }),
    [strength, cx, cy, maxR],
  )

  const dataPath = toPath(dataVertices)

  // 레이블 위치 (꼭짓점 바깥)
  const labelVertices = useMemo(
    () => getVertices(cx, cy, maxR + (showValues ? 30 : 24)),
    [cx, cy, maxR, showValues],
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="오행 레이더 차트"
    >
      {/* ── 그리드 배경 ── */}
      {gridLevels.map((level) => {
        const pts = getVertices(cx, cy, maxR * level)
        return (
          <polygon
            key={level}
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        )
      })}

      {/* ── 중심에서 꼭짓점으로 선 ── */}
      {outerVertices.map((v, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={v.x} y2={v.y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* ── 데이터 채우기 영역 (애니메이션) ── */}
      {noAnimation ? (
        <polygon
          points={dataVertices.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(232,89,60,0.15)"
          stroke="#E8593C"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : (
        <motion.polygon
          points={dataVertices.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(232,89,60,0.15)"
          stroke="#E8593C"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* ── 데이터 점 ── */}
      {dataVertices.map((v, i) => {
        const o = OHAENG_ORDER[i]
        const hex = OHAENG_COLOR[o].hex
        return (
          <motion.circle
            key={o}
            cx={v.x} cy={v.y} r={4}
            fill={hex}
            stroke="white"
            strokeWidth="1.5"
            initial={noAnimation ? undefined : { opacity: 0, scale: 0 }}
            animate={noAnimation ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.06, duration: 0.25 }}
          />
        )
      })}

      {/* ── 오행 레이블 ── */}
      {showLabels &&
        labelVertices.map((v, i) => {
          const o = OHAENG_ORDER[i]
          const color = OHAENG_COLOR[o]
          const val = strength[o]
          return (
            <g key={o}>
              <text
                x={v.x} y={v.y - (showValues ? 8 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={size * 0.075}
                fontWeight="600"
                fill={color.text}
              >
                {OHAENG_EMOJI[o]} {o}
              </text>
              {showValues && (
                <text
                  x={v.x} y={v.y + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={size * 0.055}
                  fill="#9ca3af"
                >
                  {val}%
                </text>
              )}
            </g>
          )
        })}
    </svg>
  )
}
