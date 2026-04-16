/**
 * /onboarding — 사주 입력 페이지 (DESIGN.md 기반 리디자인)
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

      setSaju(
        { year: data.year, month: data.month, day: data.day, hour: data.hour },
        { name: data.name, gender: data.gender, luckPreference: data.luckPreference },
      )

      const params = new URLSearchParams({
        y: String(data.year),
        m: String(data.month),
        d: String(data.day),
        ...(data.hour !== undefined && { h: String(data.hour) }),
        ...(data.luckPreference && { luck: data.luckPreference }),
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
    <div className="min-h-screen hero-dark flex flex-col">

      {/* ── 헤더 ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
        {/* 뒤로가기 — SVG 아이콘 */}
        <button
          onClick={() => router.back()}
          className="icon-btn-dark"
          aria-label="뒤로"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* 앱 이름 */}
        <div className="text-center">
          <p
            className="text-white font-bold text-base tracking-tight"
            style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
          >
            명당지도
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,151,58,0.8)' }}>
            오행 분석
          </p>
        </div>

        {/* 오른쪽 균형 공간 */}
        <div className="w-11" />
      </header>

      {/* ── 타이틀 영역 ─────────────────────────────────────── */}
      <div className="text-center px-6 py-5">
        <h1
          className="text-xl font-semibold text-white mb-2 leading-snug break-keep"
          style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
        >
          내 사주로{' '}
          <span style={{ color: '#C9973A' }}>맞춤 명당</span>을 찾아드려요
        </h1>
        <p className="text-xs break-keep" style={{ color: 'rgba(240,234,216,0.5)' }}>
          생년월일 입력 → 오행 분석 → 풍수 명당 추천
        </p>
      </div>

      {/* ── 폼 영역 — 흰 카드 바텀시트 ─────────────────────── */}
      <div
        className="flex-1 bg-parchment rounded-t-sheet pt-6 pb-safe overflow-y-auto"
        style={{
          boxShadow: '0 -4px 40px rgba(0,0,0,0.20)',
        }}
      >
        <BirthInputForm onSubmit={handleBirthSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
