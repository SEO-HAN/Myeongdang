/**
 * PersonalizationBanner — 지도 하단 CTA 배너 (Phase B3 개선)
 *
 * 상태별 노출:
 *  - 비로그인/미입력: 사주 입력 유도 CTA (강화된 디자인)
 *  - 프로필 완성:    부족 오행 + "내 명당 보기" 바로가기 노출
 */
'use client'

import Link from 'next/link'
import { useUserStore, useWeakOhaeng } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

export default function PersonalizationBanner() {
  const isProfileComplete = useUserStore((s) => s.isProfileComplete)
  const weakOhaeng        = useWeakOhaeng()
  const togglePersonal    = useUserStore((s) => s.togglePersonalizedMode)
  const isPersonalized    = useUserStore((s) => s.isPersonalizedMode)

  // ── 프로필 완성: 부족 오행 + 개인화 토글 ──
  if (isProfileComplete && weakOhaeng.length > 0) {
    const primaryWeak = weakOhaeng[0] as Ohaeng
    const color = OHAENG_COLOR[primaryWeak]

    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-safe pb-4">
        <button
          onClick={togglePersonal}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl shadow-bottom border transition-all duration-200"
          style={isPersonalized
            ? { backgroundColor: color.bg, borderColor: color.hex + '60' }
            : { backgroundColor: 'white', borderColor: '#e5e7eb' }
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{OHAENG_EMOJI[primaryWeak]}</span>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: isPersonalized ? color.text : '#111827' }}>
                {isPersonalized
                  ? `${weakOhaeng.map(o => `${OHAENG_EMOJI[o]} ${o}`).join(' ')} 기운 맞춤 중`
                  : '내 사주 맞춤 명당 보기'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isPersonalized ? color.text + '99' : '#6b7280' }}>
                {isPersonalized ? '탭해서 전체 명당 보기' : `부족 오행: ${weakOhaeng.map(o => `${OHAENG_EMOJI[o]}${o}`).join(' ')}`}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={isPersonalized
              ? { backgroundColor: color.hex + '33', color: color.text }
              : { backgroundColor: '#f3f4f6', color: '#374151' }
            }
          >
            {isPersonalized ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    )
  }

  // ── 미입력: 사주 입력 유도 CTA ──
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-safe pb-4">
      <Link
        href="/onboarding"
        className="flex items-center justify-between bg-brand rounded-2xl px-4 py-3.5 shadow-bottom hover:bg-brand/90 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔮</span>
          <div>
            <p className="text-sm font-bold text-white">
              내 사주로 맞춤 명당 찾기
            </p>
            <p className="text-xs text-white/75 mt-0.5">
              생년월일 입력 → 오행 분석 → 추천 명당 필터
            </p>
          </div>
        </div>
        <span className="text-white/90 font-bold text-sm">→</span>
      </Link>
    </div>
  )
}
