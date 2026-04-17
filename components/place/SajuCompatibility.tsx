'use client'

/**
 * SajuCompatibility — 장소 상세 페이지의 사주 궁합 섹션
 *
 * 사주 프로필이 있으면: 궁합 점수 + 매칭 이유 표시
 * 사주 프로필이 없으면: 온보딩 유도 CTA 버튼
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/user-store'
import { scorePlace } from '@/lib/saju/recommend'
import { OHAENG_COLOR, OHAENG_EMOJI } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'
import type { PlaceRow } from '@/types/database'

interface SajuCompatibilityProps {
  place: {
    id: string
    name: string
    ohaeng: string[]
    luck_types: string[]
    reason_text: string
    trust_score: number
  }
}

/** 매칭 이유 텍스트에 맞는 아이콘 반환 */
function getReasonIcon(reason: string): string {
  if (reason.includes('용신')) return '⭐'
  if (reason.includes('원하는')) return '🎯'
  // 부족한 오행 보충 → 해당 오행 이모지
  const ohaengList: Ohaeng[] = ['목', '화', '토', '금', '수']
  for (const o of ohaengList) {
    if (reason.includes(o)) return OHAENG_EMOJI[o]
  }
  return '✨'
}

/** SVG 원형 프로그레스 인디케이터 */
function CircularScore({ score, color }: { score: number; color: string }) {
  const size = 80
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* 배경 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* 점수 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      {/* 점수 텍스트 */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-lg font-bold"
        fill={color}
      >
        {score}%
      </text>
    </svg>
  )
}

export default function SajuCompatibility({ place }: SajuCompatibilityProps) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  // Zustand rehydrate (skipHydration 패턴)
  useEffect(() => {
    useUserStore.persist.rehydrate()
    setHydrated(true)
  }, [])

  const profile = useUserStore((s) => s.profile)
  const luckPreference = useUserStore((s) => s.luckPreference)

  // hydration 전에는 아무것도 렌더링하지 않음 (CLS 방지)
  if (!hydrated) return null

  const primaryOhaeng = (place.ohaeng[0] ?? '목') as Ohaeng
  const ohaengColor = OHAENG_COLOR[primaryOhaeng]

  // 사주 프로필이 없을 때 — CTA 버튼
  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5 rounded-2xl border-2 border-dashed p-4"
        style={{ backgroundColor: '#FDF8F0', borderColor: '#C9A96E' }}
      >
        <button
          onClick={() => router.push('/onboarding')}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
          style={{ color: '#7A5C2E' }}
        >
          <span className="text-lg">✨</span>
          내 사주로 이 장소와의 궁합 보기
        </button>
      </motion.div>
    )
  }

  // 사주 프로필이 있을 때 — 궁합 점수 계산
  const { score, matchReasons } = scorePlace(
    place as unknown as PlaceRow,
    profile.result,
    luckPreference ?? undefined,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-2xl p-4"
      style={{ backgroundColor: ohaengColor.bg }}
    >
      {/* 섹션 타이틀 */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        🔮 나와의 궁합
      </p>

      <div className="flex items-center gap-4">
        {/* 원형 점수 */}
        <CircularScore score={score} color={ohaengColor.hex} />

        {/* 매칭 이유 리스트 */}
        <div className="flex flex-1 flex-col gap-1.5">
          {matchReasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
              <span className="flex-shrink-0">{getReasonIcon(reason)}</span>
              <span className="leading-snug">{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
