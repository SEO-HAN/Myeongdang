/**
 * PersonalizationBanner — 지도 하단 CTA 배너 (DESIGN.md 기반 리디자인)
 *
 * 상태별 노출:
 *  - 비로그인/미입력: 강력한 가치 제안 CTA (소요시간 + 무료 명시)
 *  - 프로필 완성:    부족 오행 + 개인화 명당 수 + ON/OFF 토글
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUserStore, useWeakOhaeng } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

// ── 진입 애니메이션 variants ──────────────────────────────────
const bannerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export default function PersonalizationBanner() {
  const isProfileComplete = useUserStore((s) => s.isProfileComplete)
  const weakOhaeng        = useWeakOhaeng()
  const togglePersonal    = useUserStore((s) => s.togglePersonalizedMode)
  const isPersonalized    = useUserStore((s) => s.isPersonalizedMode)
  const userName          = useUserStore((s) => s.userName)

  // ── 프로필 완성: 개인화 정보 + 토글 ─────────────────────────
  if (isProfileComplete && weakOhaeng.length > 0) {
    const primaryWeak = weakOhaeng[0] as Ohaeng
    const color = OHAENG_COLOR[primaryWeak]
    // 부족 오행 이모지+이름 텍스트 (예: "🌿목 💧수")
    const weakLabel = weakOhaeng.map(o => `${OHAENG_EMOJI[o as Ohaeng]}${o}`).join(' ')
    // 사용자 이름 (없으면 "당신")
    const displayName = userName ? `${userName}님` : '당신'

    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-safe pb-3">
        <motion.button
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          onClick={togglePersonal}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200"
          style={isPersonalized
            ? {
                background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}CC 100%)`,
                border: `1.5px solid ${color.hex}50`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)`,
              }
            : {
                backgroundColor: '#FFFFFF',
                border: '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
              }
          }
          aria-label={isPersonalized ? '개인화 필터 끄기' : '내 사주 맞춤 명당 필터 켜기'}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none" aria-hidden="true">
              {OHAENG_EMOJI[primaryWeak]}
            </span>
            <div className="text-left">
              <p
                className="text-[11px] font-semibold mb-0.5"
                style={{ color: isPersonalized ? color.hex : '#C9973A' }}
              >
                {isPersonalized ? '개인화 명당 필터 적용 중' : `${displayName}의 부족 오행 · ${weakLabel}`}
              </p>
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: isPersonalized ? color.text : '#1A1824' }}
              >
                {isPersonalized
                  ? `${weakLabel} 기운을 채워줄 명당을 찾았어요`
                  : '내 사주 맞춤 명당 보기'}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: isPersonalized ? `${color.text}80` : '#6E6A7A' }}
              >
                {isPersonalized ? '탭해서 전체 명당으로 돌아가기' : '맞춤 명당 필터 켜기'}
              </p>
            </div>
          </div>

          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={isPersonalized
              ? { backgroundColor: `${color.hex}25`, color: color.text }
              : { backgroundColor: '#F3F1EC', color: '#6E6A7A' }
            }
          >
            {isPersonalized ? 'ON' : 'OFF'}
          </span>
        </motion.button>
      </div>
    )
  }

  // ── 미입력: 강력한 가치 제안 CTA ─────────────────────────────
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-safe pb-3">
      <motion.div
        variants={bannerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1A1824 0%, #2D2840 100%)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
        }}
      >
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#C9973A' }}>
              📍 오늘 당신에게 맞는 명당은?
            </p>
            <p className="text-white text-sm font-semibold leading-snug break-keep">
              생년월일로 맞춤 명당 추천받기
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(240,234,216,0.55)' }}>
              30초 · 사주 기반 · 무료
            </p>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              background: '#D94F2A',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(217,79,42,0.35)',
            }}
            aria-label="사주 입력 시작하기"
          >
            시작하기
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
