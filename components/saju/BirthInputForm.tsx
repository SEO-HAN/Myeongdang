'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface BirthFormData {
  name: string
  gender: 'male' | 'female'
  year: number
  month: number
  day: number
  hour?: number
  minute?: number  // 추가
  luckPreference?: string
}

interface BirthInputFormProps {
  onSubmit: (data: BirthFormData) => void
  isLoading?: boolean
}

const CURRENT_YEAR = new Date().getFullYear()
const QUICK_YEARS = [1975, 1980, 1985, 1990, 1995, 2000, 2005]
const TOTAL_STEPS = 3

// hour → 지시 인덱스 (engine.ts와 동일 알고리즘)
function getJisiIdx(hour: number): number {
  return hour === 23 ? 0 : Math.floor((hour + 1) / 2)
}
const JISI_KR    = ['자','축','인','묘','진','사','오','미','신','유','술','해']
const JISI_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

// 오행 매핑 (지시 → 오행)
const JISI_OHAENG = ['수','토','목','목','토','화','화','토','금','금','토','수']

// 해당 월의 실제 날수 반환 (윤년 포함)
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

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

// 언더라인 입력 필드 공통 스타일
const segInputBase: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid rgba(0,0,0,0.12)',
  outline: 'none',
  textAlign: 'center',
  fontSize: '26px',
  fontWeight: 700,
  color: '#1A1A2E',
  padding: '4px 0 6px',
  width: '100%',
  transition: 'border-color 0.15s',
  borderRadius: 0,
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
}

export default function BirthInputForm({ onSubmit, isLoading = false }: BirthInputFormProps) {
  const [step, setStep]     = useState(0)
  const [direction, setDir] = useState(1)

  // Step 0
  const [name, setName]     = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')

  // Step 1 — 세그먼트 입력
  const [yearVal,  setYearVal]  = useState('')   // 문자열로 관리
  const [monthVal, setMonthVal] = useState('')
  const [dayVal,   setDayVal]   = useState('')

  const yearRef  = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef   = useRef<HTMLInputElement>(null)

  // Step 2 — 시간 직접 입력
  const [hourVal,   setHourVal]   = useState('')   // 문자열로 관리
  const [minuteVal, setMinuteVal] = useState('')
  const hourInputRef   = useRef<HTMLInputElement>(null)
  const minuteInputRef = useRef<HTMLInputElement>(null)

  // 운 선택
  const [luckPreference, setLuck] = useState<string | null>(null)

  const go = useCallback((next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }, [step])

  // ─── 파생 값 계산 ───────────────────────────────────────────────
  const yearNum   = Number(yearVal)
  const monthNum  = Number(monthVal)
  const dayNum    = Number(dayVal)
  const hourNum   = Number(hourVal)
  const minuteNum = Number(minuteVal)

  const yearValid  = yearVal.length === 4 && yearNum >= 1900 && yearNum <= CURRENT_YEAR
  const monthValid = monthNum >= 1 && monthNum <= 12
  const dayValid   = yearValid && monthValid
    ? dayNum >= 1 && dayNum <= getDaysInMonth(yearNum, monthNum)
    : dayNum >= 1 && dayNum <= 31

  const hourFilled   = hourVal !== ''
  const minuteFilled = minuteVal !== ''

  // 지시 정보 (시간 입력 시)
  const jisiIdx   = hourFilled ? getJisiIdx(hourNum) : null
  const jisiKr    = jisiIdx !== null ? JISI_KR[jisiIdx]    : null
  const jisiHanja = jisiIdx !== null ? JISI_HANJA[jisiIdx] : null
  const jisiOhaeng = jisiIdx !== null ? JISI_OHAENG[jisiIdx] : null

  // ─── Step 1 세그먼트 핸들러 ──────────────────────────────────────

  const handleYearChange = useCallback((val: string) => {
    // 숫자만 허용, 최대 4자리
    const cleaned = val.replace(/\D/g, '').slice(0, 4)
    setYearVal(cleaned)
    setMonthVal('')
    setDayVal('')

    // 4자리 입력 완료 + 유효 연도 → 월 input으로 이동
    const num = Number(cleaned)
    if (cleaned.length === 4 && num >= 1900 && num <= CURRENT_YEAR) {
      monthRef.current?.focus()
    }
  }, [])

  const handleMonthChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2)
    let num = Number(cleaned)

    // 첫 자리가 2 이상이면 한 자리 입력 완료로 처리
    if (cleaned.length === 1 && num > 1) {
      const clamped = Math.min(num, 12)
      setMonthVal(String(clamped))
      setDayVal('')
      dayRef.current?.focus()
      return
    }

    // 2자리 완성
    if (cleaned.length === 2) {
      num = Math.max(1, Math.min(12, num))
      setMonthVal(String(num))
      setDayVal('')
      dayRef.current?.focus()
      return
    }

    setMonthVal(cleaned)
    setDayVal('')
  }, [])

  const handleDayChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2)
    let num = Number(cleaned)
    const maxDay = yearValid && monthValid ? getDaysInMonth(yearNum, monthNum) : 31

    // 첫 자리가 4 이상이면 한 자리 입력 완료로 처리
    if (cleaned.length === 1 && num > 3) {
      const clamped = Math.min(num, maxDay)
      setDayVal(String(clamped))
      return
    }

    // 2자리 완성 → maxDay로 clamp
    if (cleaned.length === 2) {
      num = Math.max(1, Math.min(maxDay, num))
      setDayVal(String(num))
      return
    }

    setDayVal(cleaned)
  }, [yearValid, monthValid, yearNum, monthNum])

  const handleQuickYear = useCallback((y: number) => {
    setYearVal(String(y))
    setMonthVal('')
    setDayVal('')
    monthRef.current?.focus()
  }, [])

  // ─── Step 2 시간 핸들러 ──────────────────────────────────────────

  const handleHourChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2)
    let num = Number(cleaned)

    // 첫 자리가 3 이상이면 한 자리로 처리
    if (cleaned.length === 1 && num > 2) {
      const clamped = Math.min(num, 23)
      setHourVal(String(clamped))
      minuteInputRef.current?.focus()
      return
    }

    // 2자리 완성
    if (cleaned.length === 2) {
      num = Math.max(0, Math.min(23, num))
      setHourVal(String(num))
      minuteInputRef.current?.focus()
      return
    }

    setHourVal(cleaned)
  }, [])

  const handleMinuteChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2)
    let num = Number(cleaned)

    if (cleaned.length === 1 && num > 5) {
      setMinuteVal(String(Math.min(num, 59)))
      return
    }

    if (cleaned.length === 2) {
      num = Math.max(0, Math.min(59, num))
      setMinuteVal(String(num))
      return
    }

    setMinuteVal(cleaned)
  }, [])

  const handleSkipTime = useCallback(() => {
    setHourVal('')
    setMinuteVal('')
  }, [])

  // ─── 유효성 & 제출 ──────────────────────────────────────────────

  const canProceed = useCallback((): boolean => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return yearValid && monthValid && dayValid && dayVal !== ''
    return true
  }, [step, name, yearValid, monthValid, dayValid, dayVal])

  const handleSubmit = useCallback(() => {
    onSubmit({
      name,
      gender,
      year:   yearNum,
      month:  monthNum,
      day:    dayNum,
      hour:   hourFilled   ? hourNum   : undefined,
      minute: minuteFilled ? minuteNum : undefined,
      luckPreference: luckPreference ?? undefined,
    })
  }, [name, gender, yearNum, monthNum, dayNum, hourFilled, hourNum, minuteFilled, minuteNum, luckPreference, onSubmit])

  // ─── Step 1 진입 시 연도 input 포커스 ───────────────────────────
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => yearRef.current?.focus(), 250)
    }
    if (step === 2) {
      setTimeout(() => hourInputRef.current?.focus(), 250)
    }
  }, [step])

  // ─── 입력 포커스 상태 관리 (border-bottom 색상) ─────────────────
  const [focusedSeg, setFocusedSeg] = useState<'year' | 'month' | 'day' | null>(null)
  const [focusedTime, setFocusedTime] = useState<'hour' | 'minute' | null>(null)

  const segBorderColor = (seg: 'year' | 'month' | 'day', hasValue: boolean) => {
    if (focusedSeg === seg) return '#C9973A'
    if (hasValue) return '#1A1A2E'
    return 'rgba(0,0,0,0.12)'
  }

  const timeBorderColor = (seg: 'hour' | 'minute', hasValue: boolean) => {
    if (focusedTime === seg) return '#C9973A'
    if (hasValue) return '#1A1A2E'
    return 'rgba(0,0,0,0.12)'
  }

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

            {/* ── STEP 1: 생년월일 세그먼트 입력 ── */}
            {step === 1 && (
              <div>
                <h2
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
                >
                  생년월일을 알려주세요
                </h2>
                <p className="text-xs mb-6" style={{ color: '#6E6A7A' }}>
                  숫자를 입력하면 자동으로 다음 칸으로 이동해요
                </p>

                {/* 세그먼트 입력 — YYYY / MM / DD */}
                <div className="flex items-end gap-2 mb-4">

                  {/* 년도 */}
                  <div className="flex flex-col items-center" style={{ flex: '2' }}>
                    <input
                      ref={yearRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="1993"
                      maxLength={4}
                      value={yearVal}
                      onChange={(e) => handleYearChange(e.target.value)}
                      onFocus={() => setFocusedSeg('year')}
                      onBlur={() => setFocusedSeg(null)}
                      style={{
                        ...segInputBase,
                        borderBottomColor: segBorderColor('year', yearVal !== ''),
                      }}
                    />
                    <span className="text-[11px] mt-1.5 font-medium" style={{ color: '#6E6A7A' }}>년</span>
                  </div>

                  <span className="text-xl font-light pb-5" style={{ color: 'rgba(0,0,0,0.2)' }}>/</span>

                  {/* 월 */}
                  <div className="flex flex-col items-center" style={{ flex: '1' }}>
                    <input
                      ref={monthRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="06"
                      maxLength={2}
                      value={monthVal}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      onFocus={() => setFocusedSeg('month')}
                      onBlur={() => setFocusedSeg(null)}
                      disabled={!yearValid}
                      style={{
                        ...segInputBase,
                        borderBottomColor: segBorderColor('month', monthVal !== ''),
                        opacity: yearValid ? 1 : 0.35,
                      }}
                    />
                    <span className="text-[11px] mt-1.5 font-medium" style={{ color: '#6E6A7A' }}>월</span>
                  </div>

                  <span className="text-xl font-light pb-5" style={{ color: 'rgba(0,0,0,0.2)' }}>/</span>

                  {/* 일 */}
                  <div className="flex flex-col items-center" style={{ flex: '1' }}>
                    <input
                      ref={dayRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="15"
                      maxLength={2}
                      value={dayVal}
                      onChange={(e) => handleDayChange(e.target.value)}
                      onFocus={() => setFocusedSeg('day')}
                      onBlur={() => setFocusedSeg(null)}
                      disabled={!monthValid || !yearValid}
                      style={{
                        ...segInputBase,
                        borderBottomColor: segBorderColor('day', dayVal !== ''),
                        opacity: (yearValid && monthValid) ? 1 : 0.35,
                      }}
                    />
                    <span className="text-[11px] mt-1.5 font-medium" style={{ color: '#6E6A7A' }}>일</span>
                  </div>
                </div>

                {/* 날짜 유효 피드백 */}
                {yearValid && monthValid && dayVal !== '' && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs mb-4"
                    style={{ color: dayValid ? '#C9973A' : '#E03A3A' }}
                  >
                    {dayValid
                      ? `${yearNum}년 ${monthNum}월 ${dayNum}일 ✓`
                      : `${monthNum}월은 ${getDaysInMonth(yearNum, monthNum)}일까지 있어요`}
                  </motion.p>
                )}

                {/* 연도 빠른 선택 칩 */}
                <div>
                  <p className="text-[11px] font-semibold mb-2 uppercase tracking-widest" style={{ color: '#C9973A' }}>
                    빠른 선택
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => handleQuickYear(y)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={yearVal === String(y)
                          ? { background: '#1A1A2E', color: '#fff',   border: '1.5px solid #1A1A2E' }
                          : { background: '#fff',    color: '#6E6A7A', border: '1.5px solid rgba(0,0,0,0.10)' }
                        }
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: 시간 직접 입력 + 운 선택 ── */}
            {step === 2 && (
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
                >
                  태어난 시각이 기억나시나요?
                </h2>
                <p className="text-xs mb-5" style={{ color: '#6E6A7A' }}>
                  정확할수록 시주(時柱) 분석이 완성돼요 · 선택
                </p>

                {/* 시 / 분 입력 */}
                <div className="flex items-end gap-3 mb-3">

                  {/* 시 */}
                  <div className="flex flex-col items-center" style={{ flex: '1' }}>
                    <input
                      ref={hourInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="14"
                      maxLength={2}
                      value={hourVal}
                      onChange={(e) => handleHourChange(e.target.value)}
                      onFocus={() => setFocusedTime('hour')}
                      onBlur={() => setFocusedTime(null)}
                      style={{
                        ...segInputBase,
                        borderBottomColor: timeBorderColor('hour', hourVal !== ''),
                      }}
                    />
                    <span className="text-[11px] mt-1.5 font-medium" style={{ color: '#6E6A7A' }}>시</span>
                  </div>

                  <span className="text-2xl font-light pb-5" style={{ color: 'rgba(0,0,0,0.2)' }}>:</span>

                  {/* 분 */}
                  <div className="flex flex-col items-center" style={{ flex: '1' }}>
                    <input
                      ref={minuteInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="30"
                      maxLength={2}
                      value={minuteVal}
                      onChange={(e) => handleMinuteChange(e.target.value)}
                      onFocus={() => setFocusedTime('minute')}
                      onBlur={() => setFocusedTime(null)}
                      disabled={!hourFilled}
                      style={{
                        ...segInputBase,
                        borderBottomColor: timeBorderColor('minute', minuteVal !== ''),
                        opacity: hourFilled ? 1 : 0.35,
                      }}
                    />
                    <span className="text-[11px] mt-1.5 font-medium" style={{ color: '#6E6A7A' }}>분</span>
                  </div>
                </div>

                {/* 지시 배지 (시 입력 즉시 표시) */}
                {hourFilled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-3 px-4 py-2.5 rounded-[10px] text-sm text-center font-medium"
                    style={{ background: '#EEF2FB', color: '#1A1A2E' }}
                  >
                    {hourVal}시{minuteVal !== '' ? ` ${minuteVal}분` : ''} →{' '}
                    <span className="font-bold">
                      {jisiKr}시({jisiHanja}時)
                    </span>
                    {' · '}
                    <span style={{ color: '#C9973A' }}>{jisiOhaeng}(土) 기운</span>
                    {' '}✓
                  </motion.div>
                )}

                {/* 건너뛰기 */}
                <button
                  onClick={handleSkipTime}
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
                    {yearVal}년 {monthVal}월 {dayVal}일
                    {hourFilled && (
                      <span style={{ color: '#6E6A7A' }}>
                        {' · '}{hourVal}시{minuteVal !== '' ? ` ${minuteVal}분` : ''} ({jisiHanja}時)
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
              disabled={isLoading}
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
