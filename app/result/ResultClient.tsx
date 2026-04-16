/**
 * ResultClient — 결과 페이지 인터랙티브 클라이언트 파트
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import OhaengResultCard from '@/components/saju/OhaengResultCard'
import ShareCardButton from '@/components/share/ShareCard'
import { useUserStore } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'

interface ResultClientProps {
  result: SajuResult
}

export default function ResultClient({ result }: ResultClientProps) {
  const router = useRouter()
  const setSaju = useUserStore((s) => s.setSaju)

  // Zustand에 결과 동기화 (공유 URL로 직접 접근한 경우 대비)
  useEffect(() => {
    setSaju(result.input)
    useUserStore.persist.rehydrate()
  }, [setSaju, result.input])

  const primaryWeak = result.weakOhaeng[0] as Ohaeng
  const weakColor   = OHAENG_COLOR[primaryWeak]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-safe">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          ←
        </button>
        <p className="text-white font-bold">오행 분석 결과</p>
        <div className="w-10" />
      </header>

      {/* 임팩트 헤더 — "나는 🔥 화가 부족한 사람" */}
      <motion.div
        className="text-center px-6 py-8"
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
          {result.pillars.year.label}년생 ·{' '}
          {result.pillars.year.cheonganKr}{result.pillars.year.jijiKr}년생
        </p>
      </motion.div>

      {/* 결과 카드 */}
      <div className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
        <OhaengResultCard result={result} />

        <div className="h-px bg-gray-100 my-5" />

        {/* 공유 섹션 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
            친구에게 공유하고 같이 명당 찾기
          </p>
          <ShareCardButton result={result} />
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
