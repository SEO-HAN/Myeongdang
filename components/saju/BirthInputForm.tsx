/**
 * BirthInputForm — 생년월일시 4단계 입력 폼
 *
 * UX 원칙:
 *  - 각 단계는 슬라이드 애니메이션으로 전환
 *  - 숫자 키패드 최적화 (inputMode="numeric")
 *  - 시간/성별은 선택 사항 (건너뛰기 제공)
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
  gender?: 'male' | 'female'
}

interface BirthInputFormProps {
  onSubmit: (data: BirthFormData) => void
  isLoading?: boolean
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()
const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
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

const TOTAL_STEPS = 4

// 슬라이드 애니메이션 variants
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// ─────────────────────────────────────────────
// 서브: 공통 섹션 헤더
// ─────────────────────────────────────────────
function StepHeader({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="text-center mb-8">
      <div className="text-5xl mb-3">{emoji}</div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1.5">{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// 서브: 숫자 입력 박스
// ─────────────────────────────────────────────
function NumberInput({
  label, value, onChange, min, max, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  min: number; max: number; placeholder: string
}) {
  const numVal = Number(value)
  const isValid = value === '' || (numVal >= min && numVal <= max)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          'w-full text-center text-2xl font-bold py-4 rounded-2xl border-2 outline-none transition-all duration-150',
          'focus:border-brand focus:ring-2 focus:ring-brand/20',
          isValid
            ? 'border-gray-200 bg-gray-50 text-gray-900'
            : 'border-red-300 bg-red-50 text-red-600',
        )}
      />
      {!isValid && value !== '' && (
        <p className="text-xs text-red-500 text-center">
          {min}~{max} 사이로 입력해주세요
        </p>
      )}
    </div>
  )
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
  const [gender, setGender]   = useState<'male' | 'female' | null>(null)

  const go = useCallback((next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }, [step])

  // ── 각 단계 검증 ──
  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1: {
        const y = Number(year)
        return y >= 1900 && y <= CURRENT_YEAR
      }
      case 2: {
        const m = Number(month), d = Number(day)
        return m >= 1 && m <= 12 && d >= 1 && d <= 31
      }
      default: return true
    }
  }, [step, year, month, day])

  // ── 최종 제출 ──
  const handleSubmit = useCallback(() => {
    const data: BirthFormData = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: hour ?? undefined,
      gender: gender ?? undefined,
    }
    onSubmit(data)
  }, [year, month, day, hour, gender, onSubmit])

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* 진행률 바 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-400">
            {step} / {TOTAL_STEPS}
          </span>
          <span className="text-xs text-brand font-semibold">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
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
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >

            {/* STEP 1: 태어난 해 */}
            {step === 1 && (
              <div>
                <StepHeader
                  emoji="📅"
                  title="태어난 해를 알려주세요"
                  sub="출생 연도(양력)를 4자리로 입력해주세요"
                />
                <NumberInput
                  label="출생 연도"
                  value={year}
                  onChange={setYear}
                  min={1900}
                  max={CURRENT_YEAR}
                  placeholder="예: 1993"
                />
                {/* 빠른 선택 */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {[1990, 1995, 2000, 2005].map((y) => (
                    <button
                      key={y}
                      onClick={() => setYear(String(y))}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                        year === String(y)
                          ? 'bg-brand text-white border-brand'
                          : 'border-gray-200 text-gray-600 hover:border-brand/50',
                      )}
                    >
                      {y}년생
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: 월/일 */}
            {step === 2 && (
              <div>
                <StepHeader
                  emoji="🗓️"
                  title="태어난 월과 일을 알려주세요"
                  sub="양력 기준으로 입력해 주세요"
                />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <NumberInput label="월" value={month} onChange={setMonth} min={1} max={12} placeholder="1~12" />
                  <NumberInput label="일" value={day}   onChange={setDay}   min={1} max={31} placeholder="1~31" />
                </div>
                {/* 월 빠른 선택 */}
                <div className="grid grid-cols-6 gap-1.5">
                  {MONTH_LABELS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMonth(String(i + 1))}
                      className={cn(
                        'py-2 rounded-xl text-xs font-medium border transition-colors',
                        month === String(i + 1)
                          ? 'bg-brand text-white border-brand'
                          : 'border-gray-200 text-gray-500 hover:border-brand/50',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: 시간 (선택) */}
            {step === 3 && (
              <div>
                <StepHeader
                  emoji="⏰"
                  title="태어난 시간이 기억나시나요?"
                  sub="시간을 알수록 사주 분석이 더 정확해져요 (선택)"
                />
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {HOUR_LABELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setHour(value === hour ? null : value)}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-left text-sm transition-all',
                        hour === value
                          ? 'bg-brand/10 border-brand text-brand font-semibold'
                          : 'border-gray-100 text-gray-700 hover:border-gray-300',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setHour(null); go(4) }}
                  className="w-full mt-3 text-sm text-gray-400 underline underline-offset-2"
                >
                  시간을 잘 모르겠어요 → 건너뛰기
                </button>
              </div>
            )}

            {/* STEP 4: 성별 (선택) */}
            {step === 4 && (
              <div>
                <StepHeader
                  emoji="🙋"
                  title="성별을 알려주세요"
                  sub="향후 용신(用神) 분석에 활용돼요 (선택)"
                />
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(gender === g ? null : g)}
                      className={cn(
                        'py-8 rounded-2xl border-2 text-4xl transition-all',
                        gender === g
                          ? 'bg-brand/10 border-brand scale-105'
                          : 'border-gray-100 hover:border-gray-300',
                      )}
                    >
                      {g === 'male' ? '👨' : '👩'}
                      <p className={cn(
                        'text-sm font-semibold mt-2',
                        gender === g ? 'text-brand' : 'text-gray-600',
                      )}>
                        {g === 'male' ? '남성' : '여성'}
                      </p>
                    </button>
                  ))}
                </div>
                {/* 요약 확인 */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">입력 확인</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">생년월일:</span>{' '}
                    {year}년 {month}월 {day}일
                    {hour !== null ? ` · ${HOUR_LABELS.find(h => h.value === hour)?.label.split('(')[0].trim()}` : ' · 시간 미입력'}
                  </p>
                  {gender && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">성별:</span> {gender === 'male' ? '남성' : '여성'}
                    </p>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-8">
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
