/**
 * ResultClient — 결과 페이지 인터랙티브 클라이언트 파트 (Phase B2 리디자인)
 *
 * 개선 사항:
 *  - IlshinBanner(card) 추가 → 오늘 일진과 결과 연결
 *  - onShare를 OhaengResultCard에 연결 → 내 명당 찾기 옆 공유 버튼
 *  - 카카오톡 공유 + 링크 복사 CTA 다중화
 */
'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import OhaengResultCard from '@/components/saju/OhaengResultCard'
import ShareCardButton from '@/components/share/ShareCard'
import IlshinBanner from '@/components/saju/IlshinBanner'
import { useUserStore } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'

interface ResultClientProps {
  result: SajuResult
}

export default function ResultClient({ result }: ResultClientProps) {
  const router  = useRouter()
  const setSaju = useUserStore((s) => s.setSaju)
  const [copied, setCopied] = useState(false)

  // Zustand에 결과 동기화 (공유 URL로 직접 접근한 경우 대비)
  useEffect(() => {
    setSaju(result.input)
    useUserStore.persist.rehydrate()
  }, [setSaju, result.input])

  // 링크 복사 핸들러
  const handleCopyLink = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const primaryWeak = result.weakOhaeng[0] as Ohaeng
  const weakColor   = OHAENG_COLOR[primaryWeak]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-safe">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="뒤로"
        >
          ←
        </button>
        <p className="text-white font-bold">오행 분석 결과</p>
        {/* 링크 복사 버튼 */}
        <button
          onClick={handleCopyLink}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-base"
          aria-label="링크 복사"
        >
          {copied ? '✓' : '🔗'}
        </button>
      </header>

      {/* 임팩트 헤더 — "나는 🔥 화가 부족한 사람" */}
      <motion.div
        className="text-center px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {OHAENG_EMOJI[primaryWeak]}
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">
          나는{' '}
          <span style={{ color: weakColor.hex }}>
            {result.weakOhaeng.map((o) => `${OHAENG_EMOJI[o]} ${o}`).join(', ')}
          </span>
          가<br />부족한 사람입니다
        </h1>
        <p className="text-sm text-white/60 mt-2">
          {result.pillars.year.cheonganKr}{result.pillars.year.jijiKr}년생
        </p>
      </motion.div>

      {/* 결과 카드 영역 */}
      <div className="bg-white rounded-t-3xl px-4 pt-6 pb-8">

        {/* 오행 분석 카드 (레이더 차트 + CTA 포함) */}
        <OhaengResultCard result={result} onShare={handleCopyLink} />

        <div className="h-px bg-gray-100 my-5" />

        {/* 오늘의 일진 — 오늘 내 운세와 연결 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            📅 오늘의 일진
          </p>
          <IlshinBanner variant="card" defaultExpanded={false} />
        </div>

        <div className="h-px bg-gray-100 my-5" />

        {/* 공유 섹션 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
            친구에게 공유하고 같이 명당 찾기 🗺️
          </p>
          <ShareCardButton result={result} />

          {/* 링크 복사 */}
          <button
            onClick={handleCopyLink}
            className="w-full mt-2 py-3 rounded-2xl border border-gray-200 text-sm text-gray-500 font-medium hover:bg-gray-50 transition-colors"
          >
            {copied ? '✅ 링크가 복사됐어요!' : '🔗 링크 복사하기'}
          </button>
        </div>

        {/* 재분석 */}
        <button
          onClick={() => router.push('/onboarding')}
          className="w-full py-3 text-sm text-gray-400 text-center"
        >
          다시 분석하기 →
        </button>
      </div>
    </div>
  )
}
