/**
 * /onboarding — 사주 입력 페이지
 *
 * 탭 구성:
 *  - [생년월일 입력] : 정확한 사주 계산 (BirthInputForm)
 *  - [간단 테스트]   : 5문항 오행 추정 (QuickTestForm)
 *
 * Vercel best practice:
 *  - Client Component (폼 상태 관리)
 *  - useRouter().push() 로 결과 페이지 이동 (URL params에 데이터 전달)
 */
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import BirthInputForm, { type BirthFormData } from '@/components/saju/BirthInputForm'
import QuickTestForm from '@/components/saju/QuickTestForm'
import { useUserStore } from '@/store/user-store'

type Tab = 'birth' | 'quick'

export default function OnboardingPage() {
  const router   = useRouter()
  const setSaju  = useUserStore((s) => s.setSaju)
  const [tab, setTab]         = useState<Tab>('birth')
  const [isLoading, setLoading] = useState(false)

  const handleBirthSubmit = useCallback(async (data: BirthFormData) => {
    setLoading(true)
    try {
      // 1. 서버 API 호출 (DB 저장 + 정확한 계산)
      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      // 2. Zustand에 결과 캐시
      setSaju(data)

      // 3. 결과 페이지로 이동 (URL params로 공유 가능한 URL 생성)
      const params = new URLSearchParams({
        y: String(data.year),
        m: String(data.month),
        d: String(data.day),
        ...(data.hour !== undefined && { h: String(data.hour) }),
        ...(data.gender && { g: data.gender }),
      })
      router.push(`/result?${params.toString()}`)
    } catch (err) {
      console.error(err)
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [setSaju, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-lg"
          aria-label="뒤로"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-base">명당지도</p>
          <p className="text-white/50 text-xs">내 오행 분석</p>
        </div>
        <div className="w-10" />
      </header>

      {/* 타이틀 */}
      <div className="text-center px-6 py-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          내 사주로<br />
          <span className="text-brand">맞춤 명당</span>을 찾아드려요
        </h1>
        <p className="text-sm text-white/50">
          생년월일을 입력하면 부족한 오행을 분석해<br />
          딱 맞는 풍수 명당을 추천해드립니다
        </p>
      </div>

      {/* 탭 전환 */}
      <div className="mx-4 mb-6">
        <div className="flex bg-white/10 rounded-2xl p-1 gap-1">
          {([ ['birth', '🗓️ 생년월일 입력'], ['quick', '⚡ 간단 테스트'] ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 bg-white rounded-t-3xl px-0 pt-8 pb-safe overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'birth' ? (
              <BirthInputForm onSubmit={handleBirthSubmit} isLoading={isLoading} />
            ) : (
              <QuickTestForm />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
