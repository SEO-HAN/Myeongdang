/**
 * BirthInputForm — 생년월일시 3단계 입력 폼 (DESIGN.md 기반 리디자인)
 *
 * UX 원칙:
 *  - 3단계: 생년월일 통합 → 태어난 시간 → 기대하는 운
 *  - 각 단계 375px 기준 1뷰 완성
 *  - 슬라이드 애니메이션 방향 전환
 *  - 골드 진행률 바 + Noto Serif KR 헤딩
 */
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BirthFormData {
  year: number
  month: number
  day: number
  hour?: number
  luckPreference?: string
}

interface BirthInputFormProps {
  onSubmit: (data: BirthFormData) => void
  isLoading?: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

const MONTH_LABELS = [
  '1월','2월','3월','4월','5월','6월',
  '7월','8월','9월','10월','11월','12월',
]

const HOUR_LABELS = [
  { value: 23, label: '밤 11시–새벽 1시', sub: '자시 子時' },
  { value: 1,  label: '새벽 1–3시',       sub: '축시 丑時' },
  { value: 3,  label: '새벽 3–5시',       sub: '인시 寅時' },
  { value: 5,  label: '새벽 5–7시',       sub: '묘시 卯時' },
  { value: 7,  label: '아침 7–9시',       sub: '진시 辰時' },
  { value: 9,  label: '오전 9–11시',      sub: '사시 巳時' },
  { value: 11, label: '오전 11시–오후 1시', sub: '오시 午時' },
  { value: 13, label: '오후 1–3시',       sub: '미시 未時' },
  { value: 15, label: '오후 3–5시',       sub: '신시 申時' },
  { value: 17, label: '오후 5–7시',       sub: '유시 酉時' },
  { value: 19, label: '저녁 7–9시',       sub: '술시 戌時' },
  { value: 21, label: '밤 9–11시',        sub: '해시 亥時' },
]

const LUCK_TYPES = [
  { icon: '💰', label: '재물운', value: '재물운' },
  { icon: '💕', label: '연애운', value: '연애운' },
  { icon: '🌿', label: '건강운', value: '건강운' },
  { icon: '💼', label: '사업운', value: '사업운' },
  { icon: '📚', label: '학업운', value: '학업운' },
  { icon: '🏡', label: '부동산운', value: '부동산운' },
]

const TOTAL_STEPS = 3

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

// ── SVG 아이콘 ────────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <rect x="2.5" y="3.5" width="15" height="14" rx="2" />
      <path strokeLinecap="round" d="M7 2v3M13 2v3M2.5 8.5h15" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="10" cy="10" r="7.5" />
      <path strokeLinecap="round" d="M10 6.5v3.75l2.5 2" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function BirthInputForm({ onSubmit, isLoading = false }: BirthInputFormProps) {
  const [step, setStep]       = useState(1)
  const [direction, setDir]   = useState(1)
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [hour, setHour]       = useState<number | null>(null)
  const [luckPreference, setLuck] = useState<string | null>(null)

  const go = useCallback((next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }, [step])

  const canProceed = useCallback((): boolean => {
    if (step === 1) {
      const y = Number(year), m = Number(month), d = Number(day)
      return y >= 1900 && y <= CURRENT_YEAR && m >= 1 && m <= 12 && d >= 1 && d <= 31
    }
    return true
  }, [step, year, month, day])

  const handleSubmit = useCallback(() => {
    onSubmit({
      year:  Number(year),
      month: Number(month),
      day:   Number(day),
      hour:  hour ?? undefined,
      luckPreference: luckPreference ?? undefined,
    })
  }, [year, month, day, hour, luckPreference, onSubmit])

  // 공통 입력 필드 스타일
  const inputClass = (valid: boolean | null) => cn(
    'w-full text-center text-xl font-bold py-3.5 rounded-input border-2 outline-none',
    'transition-all duration-150 bg-parchment-warm text-ink-dark',
    valid === true  ? 'border-gold'
    : valid === false ? 'border-red-300 bg-red-50'
    : 'border-transparent focus:border-gold focus:shadow-gold',
  )

  const yearValid  = year  !== '' ? Number(year)  >= 1900 && Number(year)  <= CURRENT_YEAR : null
  const dayValid   = day   !== '' ? Number(day)   >= 1    && Number(day)   <= 31            : null

  return (
    <div className="w-full max-w-sm mx-auto px-4">

      {/* ── 진행률 바 ──────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex gap-1.5 mb-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="progress-track">
              {i < step && <div className="progress-fill" style={{ width: '100%' }} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-right" style={{ color: 'var(--ink-mid)' }}>
          {step} / {TOTAL_STEPS}
        </p>
      </div>

      {/* ── 단계별 콘텐츠 ──────────────────────────────────── */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >

            {/* ── STEP 1: 생년월일 ── */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span style={{ color: '#C9973A' }}><CalendarIcon /></span>
                  <div>
                    <h2
                      className="text-lg font-semibold text-ink-dark"
                      style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
                    >
                      생년월일을 알려주세요
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-mid)' }}>
                      양력 기준으로 입력해 주세요
                    </p>
                  </div>
                </div>

                {/* 연도 */}
                <div className="mb-4">
                  <label className="section-label mb-1.5 block">태어난 해</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="예: 1993"
                    min={1900}
                    max={CURRENT_YEAR}
                    className={inputClass(yearValid)}
                  />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[1985, 1990, 1995, 2000, 2005].map((y) => (
                      <button
                        key={y}
                        onClick={() => setYear(String(y))}
                        className={cn(
                          'px-2.5 py-1 rounded-chip text-xs font-medium border transition-all cursor-pointer',
                          year === String(y)
                            ? 'border-gold text-gold bg-amber-50'
                            : 'border-gray-200 text-ink-mid hover:border-gold/40',
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 월 그리드 */}
                <div className="mb-4">
                  <label className="section-label mb-1.5 block">태어난 월</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTH_LABELS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setMonth(String(i + 1))}
                        className={cn(
                          'py-2.5 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer',
                          month === String(i + 1)
                            ? 'bg-gold text-white border-gold shadow-gold'
                            : 'border-gray-200 text-ink-mid hover:border-gold/40 bg-white',
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 일 */}
                <div>
                  <label className="section-label mb-1.5 block">태어난 일</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    placeholder="1–31"
                    min={1}
                    max={31}
                    className={inputClass(dayValid)}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: 태어난 시간 (선택) ── */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span style={{ color: '#C9973A' }}><ClockIcon /></span>
                  <div>
                    <h2
                      className="text-lg font-semibold text-ink-dark"
                      style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
                    >
                      태어난 시간이 기억나시나요?
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-mid)' }}>
                      알수록 사주 분석이 더 정확해져요 · 선택
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {HOUR_LABELS.map(({ value, label, sub }) => (
                    <button
                      key={value}
                      onClick={() => setHour(value === hour ? null : value)}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border text-left transition-all cursor-pointer',
                        'flex items-center justify-between',
                        hour === value
                          ? 'border-gold bg-amber-50/60'
                          : 'border-gray-100 bg-white hover:border-gold/30',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        hour === value ? 'text-gold' : 'text-ink-dark',
                      )}>{label}</span>
                      <span className="text-xs text-ink-faint">{sub}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setHour(null); go(3) }}
                  className="w-full mt-3 text-sm text-ink-mid underline underline-offset-2 cursor-pointer"
                >
                  시간을 잘 모르겠어요 · 건너뛰기
                </button>
              </div>
            )}

            {/* ── STEP 3: 기대하는 운 (선택) ── */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span style={{ color: '#C9973A' }}><SparklesIcon /></span>
                  <div>
                    <h2
                      className="text-lg font-semibold text-ink-dark"
                      style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
                    >
                      어떤 운을 원하시나요?
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-mid)' }}>
                      맞춤 명당 추천에 활용돼요 · 선택
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {LUCK_TYPES.map(({ icon, label, value }) => (
                    <button
                      key={value}
                      onClick={() => setLuck(luckPreference === value ? null : value)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-4 rounded-btn border-2 text-left',
                        'transition-all duration-150 cursor-pointer',
                        luckPreference === value
                          ? 'border-gold bg-amber-50/70 scale-[1.02]'
                          : 'border-gray-100 bg-white hover:border-gold/30',
                      )}
                    >
                      <span className="text-xl leading-none">{icon}</span>
                      <span className={cn(
                        'text-sm font-semibold',
                        luckPreference === value ? 'text-gold' : 'text-ink-dark',
                      )}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 입력 요약 */}
                <div
                  className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
                  style={{ background: '#F3F1EC' }}
                >
                  <span className="text-base">🗓️</span>
                  <span className="text-ink-dark font-medium">
                    {year}년 {month}월 {day}일
                    {hour !== null && (
                      <span className="text-ink-mid font-normal">
                        {' · '}
                        {HOUR_LABELS.find(h => h.value === hour)?.label}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 버튼 영역 ──────────────────────────────────────── */}
      <div className="flex gap-2.5 mt-6">
        {step > 1 && (
          <button
            onClick={() => go(step - 1)}
            className={cn(
              'flex-1 py-4 rounded-btn border-2 font-semibold text-sm',
              'border-gray-200 text-ink-mid hover:border-gold/40 transition-colors cursor-pointer',
            )}
          >
            이전
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => go(step + 1)}
            disabled={!canProceed()}
            className={cn(
              'flex-[2] py-4 rounded-btn font-bold text-white text-sm transition-all cursor-pointer',
              canProceed()
                ? 'btn-primary'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
            style={canProceed() ? {} : { boxShadow: 'none' }}
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !canProceed()}
            className={cn(
              'flex-[2] py-4 rounded-btn font-bold text-white text-sm transition-all cursor-pointer',
              isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'btn-primary',
            )}
            style={isLoading ? { boxShadow: 'none' } : {}}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                분석 중...
              </span>
            ) : (
              '내 오행 분석하기'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
