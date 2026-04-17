/**
 * PersonalizationBanner — 지도 하단 CTA 배너 (DESIGN.md 기반 리디자인)
 *
 * 상태별 노출:
 *  - 비로그인/미입력: 사주 입력 유도 CTA (SVG 아이콘, 세련된 카드)
 *  - 프로필 완성:    부족 오행 + "내 명당 보기" 바로가기 노출
 */
'use client'

import Link from 'next/link'
import { useUserStore, useWeakOhaeng } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

// ── SVG 아이콘 ────────────────────────────────────────────────
function SparklesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function PersonalizationBanner() {
  const isProfileComplete = useUserStore((s) => s.isProfileComplete)
  const weakOhaeng        = useWeakOhaeng()
  const togglePersonal    = useUserStore((s) => s.togglePersonalizedMode)
  const isPersonalized    = useUserStore((s) => s.isPersonalizedMode)

  // ── 프로필 완성: 감성적 메시지 + 개인화 토글 ──────────────
  if (isProfileComplete && weakOhaeng.length > 0) {
    const primaryWeak = weakOhaeng[0] as Ohaeng
    const color = OHAENG_COLOR[primaryWeak]
    // 부족 오행 이모지+이름 텍스트 (예: "🌿목")
    const weakLabel = weakOhaeng.map(o => `${OHAENG_EMOJI[o as Ohaeng]}${o}`).join(' ')

    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-safe pb-4">
        <button
          onClick={togglePersonal}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-lg cursor-pointer transition-all duration-200"
          style={isPersonalized
            ? {
                background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}CC 100%)`,
                border: `1.5px solid ${color.hex}50`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              }
            : {
                backgroundColor: '#FFFFFF',
                border: '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
              }
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">{OHAENG_EMOJI[primaryWeak]}</span>
            <div className="text-left">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: isPersonalized ? color.text : '#1A1824' }}
              >
                {isPersonalized
                  ? `당신의 부족한 ${weakLabel} 기운을 채워줄 명당을 찾았어요`
                  : '내 사주 맞춤 명당 보기'}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: isPersonalized ? `${color.text}90` : '#6E6A7A' }}
              >
                {isPersonalized
                  ? '탭해서 전체 명당 보기'
                  : `부족 오행 · ${weakLabel}`}
              </p>
            </div>
          </div>

          <span
            className="text-xs font-bold px-2.5 py-1 rounded-chip"
            style={isPersonalized
              ? { backgroundColor: `${color.hex}25`, color: color.text }
              : { backgroundColor: '#F3F1EC', color: '#6E6A7A' }
            }
          >
            {isPersonalized ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    )
  }

  // ── 미입력: 사주 입력 유도 CTA ────────────────────────────
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-safe pb-4">
      <Link
        href="/onboarding"
        className="flex items-center justify-between px-4 py-3.5 rounded-lg transition-all"
        style={{
          background: 'linear-gradient(135deg, #D94F2A 0%, #B83720 100%)',
          boxShadow: '0px 0px 0px 1px #D94F2A, 0px 4px 20px rgba(217,79,42,0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white opacity-90"><SparklesIcon /></span>
          <div>
            <p
              className="text-sm font-bold text-white leading-tight"
              style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
            >
              3분이면 나만의 명당을 찾을 수 있어요
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.70)' }}>
              생년월일 입력 → 오행 분석 → 추천 명당
            </p>
          </div>
        </div>
        <span className="text-white opacity-75"><ChevronRightIcon /></span>
      </Link>
    </div>
  )
}
