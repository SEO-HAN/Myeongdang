/**
 * OhaengFilterBar — 오행 필터 탭 + 개인화 토글
 *
 * UX:
 *  - 상단 고정 (지도 위에 오버레이)
 *  - 사주 있으면: 내 사주 모드 토글 + 수동 오행 탭
 *  - 사주 없으면: 전체 탭 + "사주 입력" CTA 칩
 */
'use client'

import { useUserStore, useActiveFilter, useWeakOhaeng } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { cn } from '@/lib/utils'
import type { Ohaeng } from '@/lib/saju/types'

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수']

const OHAENG_LABEL: Record<Ohaeng, string> = {
  목: '목 木', 화: '화 火', 토: '토 土', 금: '금 金', 수: '수 水',
}

export default function OhaengFilterBar() {
  const activeFilter      = useActiveFilter()
  const weakOhaeng        = useWeakOhaeng()
  const isPersonalized    = useUserStore((s) => s.isPersonalizedMode)
  const isProfileComplete = useUserStore((s) => s.isProfileComplete)
  const setFilter         = useUserStore((s) => s.setOhaengFilter)
  const togglePersonal    = useUserStore((s) => s.togglePersonalizedMode)
  const resetFilter       = useUserStore((s) => s.resetFilter)

  const toggleOhaeng = (o: Ohaeng) => {
    if (activeFilter.includes(o)) {
      const next = activeFilter.filter((f) => f !== o)
      setFilter(next)
    } else {
      setFilter([...activeFilter, o])
    }
  }

  const isAllActive = activeFilter.length === 0

  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-2 pointer-events-none">
      <div className="pointer-events-auto">

        {/* 개인화 토글 배너 (사주 있을 때) */}
        {isProfileComplete && (
          <button
            onClick={togglePersonal}
            className={cn(
              'w-full mb-2 flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium shadow-card transition-all duration-200',
              isPersonalized
                ? 'bg-brand text-white'
                : 'bg-white text-gray-700 border border-gray-200',
            )}
          >
            <span className="flex items-center gap-2">
              <span>{isPersonalized ? '✨' : '☆'}</span>
              {isPersonalized
                ? `내 사주 맞춤 — ${weakOhaeng.map((o) => OHAENG_EMOJI[o]).join(' ')} 부족`
                : '내 사주에 맞는 명당만 보기'}
            </span>
            <span className="text-xs opacity-75">
              {isPersonalized ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* 오행 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">

          {/* 전체 칩 */}
          <button
            onClick={resetFilter}
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-medium shadow-sm transition-all duration-150',
              isAllActive
                ? 'bg-gray-800 text-white shadow-md scale-105'
                : 'bg-white text-gray-600 border border-gray-200',
            )}
          >
            🗺️ 전체
          </button>

          {/* 오행별 칩 */}
          {OHAENG_LIST.map((o) => {
            const isActive  = activeFilter.includes(o)
            const isWeak    = weakOhaeng.includes(o)
            const color     = OHAENG_COLOR[o]

            return (
              <button
                key={o}
                onClick={() => toggleOhaeng(o)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all duration-150',
                  isActive
                    ? 'shadow-md scale-105 text-white ring-2 ring-offset-1'
                    : 'bg-white border border-gray-200 text-gray-700',
                )}
                style={isActive
                  ? { backgroundColor: color.hex }
                  : undefined
                }
              >
                <span>{OHAENG_EMOJI[o]}</span>
                <span>{OHAENG_LABEL[o]}</span>
                {/* 내 부족 오행 표시 */}
                {isWeak && !isActive && (
                  <span className="ml-0.5 text-[9px] font-bold text-brand">부족</span>
                )}
              </button>
            )
          })}

          {/* 사주 입력 CTA (사주 없을 때) */}
          {!isProfileComplete && (
            <a
              href="/onboarding"
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-brand text-white shadow-md whitespace-nowrap"
            >
              ✨ 내 사주로 찾기
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
