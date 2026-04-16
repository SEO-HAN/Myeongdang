/**
 * BirthInputForm — 생년월일시 3단계 입력 폼
 *
 * UX 원칙 (ux-design.md 준수):
 *  - 3단계: 생년월일 통합 → 태어난 시간 → 기대하는 운
 *  - 각 단계는 375px 기준 1뷰에 완성
 *  - 슬라이드 애니메이션으로 방향감 있는 전환
 *  - 진행률 바 상단 고정
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

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()

const MONTH_LABELS = [
  '1월','2월','3월','4월','5월','6월',
  '7월','8월','9월','10월','11월','12월',
]

const HOUR_LABELS = [
  { value: 23, label: '밤 11시–새벽 1시 (자시 子時)' },
  { value: 1,  label: '새벽 1–3시 (축시 丑時)' },
  { value: 3,  label: '새벽 3–5시 (인시 寅時)' },
  { value: 5,  label: '새벽 5–7시 (묘시 卯時)' },
  { value: 7,  label: '아침 7–9시 (진시 辰時)' },
  { value: 9,  label: '오전 9–11시 (사시 巳時)' },
  { value: 11, label: '오전 11시–오후 1시 (오시 午時)' },
  { value: 13, label: '오후 1–3시 (미시 未時)' },
  { value: 15, label: '오후 3–5시 (신시 申時)' },
  { value: 17, label: '오후 5–7시 (유시 酉時)' },
  { value: 19, label: '저녁 7–9시 (술시 戌時)' },
  { value: 21, label: '밤 9–11시 (해시 亥時)' },
]

// 운 유형 아이콘 카드
const LUCK_TYPES = [
  { icon: '💰', label: '재물운', value: '재물운' },
  { icon: '💕', label: '연애운', value: '연애운' },
  { icon: '🏥', label: '건강운', value: '건강운' },
  { icon: '💼', label: '사업운', value: '사업운' },
  { icon: '🎓', label: '학업운', value: '학업운' },
  { icon: '🏠', label: '부동산운', value: '부동산운' },
]

const TOTAL_STEPS = 3

// 슬라이드 애니메이션 variants (ux-design.md 기준)
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
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

  // Step 1: 생년월일 3개 필드 모두 유효해야 다음 이동
  const canProceed = useCallback((): boolean => {
    if (step === 1) {
      const y = Number(year)
      const m = Number(month)
      const d = Number(day)
      return (
        y >= 1900 && y <= CURRENT_YEAR &&
        m >= 1 && m <= 12 &&
        d >= 1 && d <= 31
      )
    }
    return true
  }, [step, year, month, day])

  const handleSubmit = useCallback(() => {
    const data: BirthFormData = {
      year:  Number(year),
      month: Number(month),
      day:   Number(day),
      hour:  hour ?? undefined,
      luckPreference: luckPreference ?? undefined,
    }
    onSubmit(data)
  }, [year, month, day, hour, luckPreference, onSubmit])

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* 진행률 바 (ux-design.md 패턴) */}
      <div className="mb-5">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i < step ? 'bg-brand' : 'bg-gray-200',
              )}
            />
          ))}
        </div>
        <p className="text-xs text-right text-gray-400 mt-1">{step} / {TOTAL_STEPS}</p>
      </div>

      {/* 단계별 콘텐츠 */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >

            {/* ── STEP 1: 생년월일 통합 ── */}
            {step === 1 && (
              <div>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">📅</div>
                  <h2 className="text-lg font-bold text-gray-900">생년월일을 알려주세요</h2>
                  <p className="text-xs text-gray-400 mt-1">양력 기준으로 입력해 주세요</p>
                </div>

                {/* 연도 */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    태어난 해
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="예: 1993"
                    min={1900}
                    max={CURRENT_YEAR}
                    className={cn(
                      'w-full text-center text-xl font-bold py-3 rounded-2xl border-2 outline-none transition-all duration-150',
                      'focus:border-brand focus:ring-2 focus:ring-brand/20 bg-gray-50 text-gray-900',
                      year !== '' && Number(year) >= 1900 && Number(year) <= CURRENT_YEAR
                        ? 'border-brand/50'
                        : year !== '' ? 'border-red-300 bg-red-50' : 'border-gray-200',
                    )}
                  />
                  {/* 빠른 연도 선택 */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[1985, 1990, 1995, 2000, 2005].map((y) => (
                      <button
                        key={y}
                        onClick={() => setYear(String(y))}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          year === String(y)
                            ? 'bg-brand text-white border-brand'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300',
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 월 그리드 */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    태어난 월
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTH_LABELS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setMonth(String(i + 1))}
                        className={cn(
                          'py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                          month === String(i + 1)
                            ? 'bg-brand text-white border-brand'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 일 */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    태어난 일
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    placeholder="1~31"
                    min={1}
                    max={31}
                    className={cn(
                      'w-full text-center text-xl font-bold py-3 rounded-2xl border-2 outline-none transition-all duration-150',
                      'focus:border-brand focus:ring-2 focus:ring-brand/20 bg-gray-50 text-gray-900',
                      day !== '' && Number(day) >= 1 && Number(day) <= 31
                        ? 'border-brand/50'
                        : day !== '' ? 'border-red-300 bg-red-50' : 'border-gray-200',
                    )}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: 태어난 시간 (선택) ── */}
            {step === 2 && (
              <div>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">⏰</div>
                  <h2 className="text-lg font-bold text-gray-900">태어난 시간이 기억나시나요?</h2>
                  <p className="text-xs text-gray-400 mt-1">시간을 알수록 사주 분석이 더 정확해져요 (선택)</p>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {HOUR_LABELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setHour(value === hour ? null : value)}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-left text-sm transition-all',
                        hour === value
                          ? 'bg-brand/10 border-brand text-brand font-semibold'
                          : 'border-gray-100 text-gray-700 hover:border-gray-200',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setHour(null); go(3) }}
                  className="w-full mt-3 text-sm text-gray-400 underline underline-offset-2"
                >
                  시간을 잘 모르겠어요 → 건너뛰기
                </button>
              </div>
            )}

            {/* ── STEP 3: 기대하는 운 선택 (선택) ── */}
            {step === 3 && (
              <div>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">✨</div>
                  <h2 className="text-lg font-bold text-gray-900">어떤 운을 원하시나요?</h2>
                  <p className="text-xs text-gray-400 mt-1">맞춤 명당 추천에 활용돼요 (선택)</p>
                </div>

                {/* 운 유형 2열 카드 */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {LUCK_TYPES.map(({ icon, label, value }) => (
                    <button
                      key={value}
                      onClick={() => setLuck(luckPreference === value ? null : value)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-4 rounded-2xl border-2 text-left transition-all duration-150',
                        luckPreference === value
                          ? 'bg-brand/10 border-brand scale-[1.02]'
                          : 'border-gray-100 hover:border-gray-200',
                      )}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className={cn(
                        'text-sm font-semibold',
                        luckPreference === value ? 'text-brand' : 'text-gray-700',
                      )}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 입력 요약 */}
                <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-500">
                  <span className="font-medium text-gray-800">
                    {year}년 {month}월 {day}일
                  </span>
                  {hour !== null && (
                    <span className="ml-1">
                      · {HOUR_LABELS.find(h => h.value === hour)?.label.split('(')[0].trim()}
                    </span>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => go(step - 1)}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 transition-colors"
          >
            ← 이전
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => go(step + 1)}
            disabled={!canProceed()}
            className={cn(
              'flex-[2] py-4 rounded-2xl font-bold text-white transition-all',
              canProceed()
                ? 'bg-brand hover:bg-brand/90 shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !canProceed()}
            className={cn(
              'flex-[2] py-4 rounded-2xl font-bold text-white transition-all',
              isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 shadow-md hover:shadow-lg active:scale-[0.98]',
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                분석 중...
              </span>
            ) : (
              '✨ 내 오행 분석하기'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
