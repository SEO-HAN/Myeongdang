/**
 * /onboarding — 사주 입력 페이지 (Phase B1 리디자인)
 *
 * 3단계 Progressive Disclosure:
 *  Step 1: 생년월일 통합 입력
 *  Step 2: 태어난 시간 선택 (선택)
 *  Step 3: 기대하는 운 선택 (선택)
 */
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BirthInputForm, { type BirthFormData } from '@/components/saju/BirthInputForm'
import { useUserStore } from '@/store/user-store'

export default function OnboardingPage() {
  const router  = useRouter()
  const setSaju = useUserStore((s) => s.setSaju)
  const [isLoading, setLoading] = useState(false)

  const handleBirthSubmit = useCallback(async (data: BirthFormData) => {
    setLoading(true)
    try {
      // 1. 서버 API 호출 (정확한 사주 계산)
      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year:  data.year,
          month: data.month,
          day:   data.day,
          hour:  data.hour,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      // 2. Zustand에 사주 결과 캐시
      setSaju({ year: data.year, month: data.month, day: data.day, hour: data.hour })

      // 3. 결과 페이지로 이동 (URL params → 공유 가능한 URL)
      const params = new URLSearchParams({
        y: String(data.year),
        m: String(data.month),
        d: String(data.day),
        ...(data.hour !== undefined && { h: String(data.hour) }),
      })
      router.push(`/result?${params.toString()}`)
    } catch (err) {
      console.error('[온보딩] 사주 계산 오류:', err)
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [setSaju, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
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
      <div className="text-center px-6 py-4">
        <h1 className="text-xl font-bold text-white mb-1.5">
          내 사주로{' '}
          <span className="text-brand">맞춤 명당</span>을 찾아드려요
        </h1>
        <p className="text-xs text-white/50">
          생년월일 입력 → 오행 분석 → 풍수 명당 추천
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="flex-1 bg-white rounded-t-3xl pt-6 pb-safe overflow-y-auto">
        <BirthInputForm onSubmit={handleBirthSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
