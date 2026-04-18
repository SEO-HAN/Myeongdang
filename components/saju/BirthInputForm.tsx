'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BirthFormData {
  name: string
  gender: 'male' | 'female'
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
const QUICK_YEARS = [1975, 1980, 1985, 1990, 1995, 2000, 2005]
const MONTH_LABELS = ['1','2','3','4','5','6','7','8','9','10','11','12']
const TOTAL_STEPS = 3

// hour → 지시 인덱스 (engine.ts와 동일 알고리즘)
function getJisiIdx(hour: number): number {
  return hour === 23 ? 0 : Math.floor((hour + 1) / 2)
}
const JISI_KR    = ['자','축','인','묘','진','사','오','미','신','유','술','해']
const JISI_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

const LUCK_TYPES = [
  { icon: '💰', label: '재물운', value: '재물운' },
  { icon: '💕', label: '연애운', value: '연애운' },
  { icon: '🌿', label: '건강운', value: '건강운' },
  { icon: '💼', label: '사업운', value: '사업운' },
  { icon: '📚', label: '학업운', value: '학업운' },
  { icon: '🏡', label: '부동산운', value: '부동산운' },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export default function BirthInputForm({ onSubmit, isLoading = false }: BirthInputFormProps) {
  const [step, setStep]     = useState(0)
  const [direction, setDir] = useState(1)

  // Step 0
  const [name, setName]     = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')

  // Step 1
  const [year, setYear]           = useState('')
  const [month, setMonth]         = useState<number | null>(null)
  const [day, setDay]             = useState<number | null>(null)
  const [showMonth, setShowMonth] = useState(false)
  const [showDay, setShowDay]     = useState(false)

  // Step 2
  const [hour, setHour]           = useState<number | null>(null)
  const [luckPreference, setLuck] = useState<string | null>(null)

  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (autoTimer.current) clearTimeout(autoTimer.current) }, [])

  const go = useCallback((next: number) => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    setDir(next > step ? 1 : -1)
    setStep(next)
  }, [step])

  const yearNum   = Number(year)
  const yearValid = year !== '' && yearNum >= 1900 && yearNum <= CURRENT_YEAR

  // 연도 유효 → 월 그리드 등장
  useEffect(() => {
    if (yearValid && !showMonth) setShowMonth(true)
  }, [yearValid, showMonth])

  const handleYearChange = useCallback((val: string) => {
    setYear(val)
    setMonth(null)
    setDay(null)
    setShowMonth(false)
    setShowDay(false)
  }, [])

  // 월 선택 → 일 그리드 등장
  const handleMonthSelect = useCallback((m: number) => {
    setMonth(m)
    setDay(null)
    setShowDay(true)
  }, [])

  // 일 선택 → 600ms 후 Step 2 이동
  const handleDaySelect = useCallback((d: number) => {
    setDay(d)
    if (autoTimer.current) clearTimeout(autoTimer.current)
    autoTimer.current = setTimeout(() => go(2), 600)
  }, [go])

  const canProceed = useCallback((): boolean => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return yearValid && month !== null && day !== null
    return true
  }, [step, name, yearValid, month, day])

  const handleSubmit = useCallback(() => {
    onSubmit({
      name,
      gender,
      year: yearNum,
      month: month!,
      day: day!,
      hour: hour ?? undefined,
      luckPreference: luckPreference ?? undefined,
    })
  }, [name, gender, yearNum, month, day, hour, luckPreference, onSubmit])

  const selectedJisiIdx   = hour !== null ? getJisiIdx(hour) : null
  const selectedJisiKr    = selectedJisiIdx !== null ? JISI_KR[selectedJisiIdx]    : null
  const selectedJisiHanja = selectedJisiIdx !== null ? JISI_HANJA[selectedJisiIdx] : null

  return (
    <div className="w-full max-w-sm mx-auto px-4">

      {/* 진행률 바 */}
      <div className="mb-6">
        <div className="flex gap-1.5 mb-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: i <= step ? '100%' : '0%', background: '#1A1A2E' }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-right tabular-nums" style={{ color: '#6E6A7A' }}>
          {step + 1} / {TOTAL_STEPS}
        </p>
      </div>

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

            {/* ── STEP 0: 이름 + 성별 ── */}
            {step === 0 && (
              <div>
                <div className="flex flex-col items-center mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9973A' }}>
                    명당지도에 오신 걸 환영해요
                  </p>
                  <h2
                    className="text-2xl font-semibold text-center leading-snug"
                    style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
                  >
                    먼저 이름을 알려주세요
                  </h2>
                </div>

                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="홍길동"
                    maxLength={10}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-center text-xl font-bold rounded-2xl py-4 px-4 outline-none transition-all bg-white"
                    style={{ border: '2px solid rgba(0,0,0,0.08)', color: '#1A1A2E' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1A1A2E' }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(0,0,0,0.08)' }}
                  />
                </div>

                <div className="mb-8">
                  <p className="text-sm text-center mb-3" style={{ color: '#6E6A7A' }}>성별을 선택해주세요</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className="py-4 rounded-[14px] font-semibold text-base transition-all"
                        style={gender === g
                          ? { background: '#1A1A2E', color: '#fff',   border: '2px solid #1A1A2E' }
                          : { background: '#fff',    color: '#6E6A7A', border: '1.5px solid rgba(0,0,0,0.10)' }
                        }
                      >
                        {g === 'male' ? '남성' : '여성'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { if (name.trim()) go(1) }}
                  disabled={!name.trim()}
                  className="w-full py-4 rounded-[14px] font-bold text-base transition-all"
                  style={{
                    background: name.trim() ? '#1A1A2E' : '#E8E4DC',
                    color:      name.trim() ? '#fff'    : '#A09AA8',
                  }}
                >
                  시작하기
                </button>
              </div>
            )}

            {/* ── STEP 1: 생년월일 그리드 ── */}
            {step === 1 && (
              <div>
                <h2
                  className="text-lg font-semibold mb-5"
                  style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
                >
                  생년월일을 알려주세요
                </h2>

                {/* 연도 입력 */}
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#C9973A' }}>
                    태어난 해
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    placeholder="예: 1993"
                    min={1900}
                    max={CURRENT_YEAR}
                    className="w-full text-center text-xl font-bold py-3.5 rounded-[10px] outline-none transition-all bg-white"
                    style={{ border: `2px solid ${yearValid ? '#1A1A2E' : 'rgba(0,0,0,0.08)'}`, color: '#1A1A2E' }}
                  />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {QUICK_YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => handleYearChange(String(y))}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={year === String(y)
                          ? { background: '#1A1A2E', color: '#fff',   border: '1.5px solid #1A1A2E' }
                          : { background: '#fff',    color: '#6E6A7A', border: '1.5px solid rgba(0,0,0,0.10)' }
                        }
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 월 그리드 */}
                {showMonth && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4"
                  >
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#C9973A' }}>
                      태어난 월
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTH_LABELS.map((m, i) => {
                        const val      = i + 1
                        const selected = month === val
                        return (
                          <button
                            key={val}
                            onClick={() => handleMonthSelect(val)}
                            className="py-3 rounded-[10px] text-sm font-semibold transition-all"
                            style={selected
                              ? { background: '#1A1A2E', color: '#fff',   border: '2px solid #1A1A2E' }
                              : { background: '#fff',    color: '#1A1A2E', border: '1.5px solid rgba(0,0,0,0.10)' }
                            }
                          >
                            {m}월
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 일 그리드 */}
                {showDay && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#C9973A' }}>
                      태어난 일
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => {
                        const val      = i + 1
                        const selected = day === val
                        return (
                          <button
                            key={val}
                            onClick={() => handleDaySelect(val)}
                            className="aspect-square flex items-center justify-center rounded-[8px] text-xs font-semibold transition-all"
                            style={selected
                              ? { background: '#1A1A2E', color: '#fff' }
                              : { background: '#fff', color: '#1A1A2E', border: '1px solid rgba(0,0,0,0.08)' }
                            }
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── STEP 2: 시간 (0~23 그리드) + 운 선택 ── */}
            {step === 2 && (
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
                >
                  태어난 시간이 기억나시나요?
                </h2>
                <p className="text-xs mb-4" style={{ color: '#6E6A7A' }}>
                  정확할수록 시주(時柱) 분석이 완성돼요 · 선택
                </p>

                {/* 지시 안내 배너 */}
                {hour !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-3 px-4 py-2.5 rounded-[10px] text-sm text-center font-medium"
                    style={{ background: '#EEF2FB', color: '#1A1A2E' }}
                  >
                    {hour}시 →{' '}
                    <span className="font-bold">
                      {selectedJisiKr}시({selectedJisiHanja}時)
                    </span>
                    에 태어나셨군요 ✓
                  </motion.div>
                )}

                {/* 0~23시 그리드 */}
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {Array.from({ length: 24 }, (_, i) => {
                    const selected  = hour === i
                    const jisiHanja = JISI_HANJA[getJisiIdx(i)]
                    return (
                      <button
                        key={i}
                        onClick={() => setHour(hour === i ? null : i)}
                        className="rounded-[10px] py-2 flex flex-col items-center gap-0.5 transition-all"
                        style={selected
                          ? { background: '#1A1A2E', color: '#fff' }
                          : { background: '#fff', color: '#1A1A2E', border: '1px solid rgba(0,0,0,0.08)' }
                        }
                      >
                        <span className="text-xs font-bold tabular-nums">{i}시</span>
                        <span className={cn('text-[9px]', selected ? 'opacity-70' : 'opacity-40')}>
                          {jisiHanja}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setHour(null)}
                  className="w-full text-xs mb-5 underline underline-offset-2 py-1"
                  style={{ color: '#6E6A7A' }}
                >
                  시간을 잘 모르겠어요 · 건너뛰기
                </button>

                {/* 운 선택 */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold mb-2 uppercase tracking-widest" style={{ color: '#C9973A' }}>
                    어떤 운을 원하시나요? · 선택
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {LUCK_TYPES.map(({ icon, label, value }) => (
                      <button
                        key={value}
                        onClick={() => setLuck(luckPreference === value ? null : value)}
                        className="flex items-center gap-2.5 px-3 py-3.5 rounded-[14px] text-left transition-all"
                        style={luckPreference === value
                          ? { background: '#1A1A2E', color: '#fff',   border: '2px solid #1A1A2E' }
                          : { background: '#fff',    color: '#1A1A2E', border: '1.5px solid rgba(0,0,0,0.10)' }
                        }
                      >
                        <span className="text-lg leading-none">{icon}</span>
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 입력 요약 */}
                <div className="rounded-[10px] px-4 py-3 text-sm" style={{ background: '#F3F3F0' }}>
                  <span className="font-medium" style={{ color: '#1A1A2E' }}>
                    {year}년 {month}월 {day}일
                    {hour !== null && (
                      <span style={{ color: '#6E6A7A' }}>
                        {' · '}{hour}시 ({selectedJisiHanja}時)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 네비게이션 버튼 — Step 0은 자체 버튼, Step 1~2만 공통 */}
      {step > 0 && (
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={() => go(step - 1)}
            className="flex-1 py-4 rounded-[14px] font-semibold text-sm transition-all"
            style={{ background: '#fff', color: '#6E6A7A', border: '1.5px solid rgba(0,0,0,0.10)' }}
          >
            이전
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => { if (canProceed()) go(step + 1) }}
              disabled={!canProceed()}
              className="flex-[2] py-4 rounded-[14px] font-bold text-sm transition-all"
              style={{
                background: canProceed() ? '#1A1A2E' : '#E8E4DC',
                color:      canProceed() ? '#fff'    : '#A09AA8',
              }}
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canProceed()}
              className="flex-[2] py-4 rounded-[14px] font-bold text-sm transition-all"
              style={{
                background: isLoading ? '#E8E4DC' : '#1A1A2E',
                color:      isLoading ? '#A09AA8' : '#fff',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  분석 중...
                </span>
              ) : '내 사주 분석하기'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
