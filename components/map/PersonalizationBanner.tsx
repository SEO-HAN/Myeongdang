/**
 * PersonalizationBanner — 지도 하단 사주 입력 유도 배너
 * 사주 미입력 유저에게 노출. 입력 후 자동 숨김.
 */
'use client'

import { useUserStore } from '@/store/user-store'
import Link from 'next/link'

export default function PersonalizationBanner() {
  const isProfileComplete = useUserStore((s) => s.isProfileComplete)
  if (isProfileComplete) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-safe pb-6">
      <Link
        href="/onboarding"
        className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-bottom border border-gray-100 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔮</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              내 사주에 맞는 명당 찾기
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              생년월일 입력 → 부족 오행 분석 → 맞춤 장소 추천
            </p>
          </div>
        </div>
        <span className="text-brand font-bold text-sm">→</span>
      </Link>
    </div>
  )
}
