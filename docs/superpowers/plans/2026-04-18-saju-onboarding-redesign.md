# 사주 온보딩 & 결과 페이지 풀 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 온보딩 플로우를 3단계로 압축하고 정밀 시간 입력(0~23시 그리드)을 도입, 전체 디자인을 모던 미니멀 라이트 테마로 전환한다.

**Architecture:** `BirthInputForm`을 완전 재작성해 생년월일 그리드 입력(연/월 4×3/일 7×5)과 24시 정밀 시간 그리드를 구현. `OhaengStrengthBar` 신규 컴포넌트로 결과 페이지 히어로를 오행 바차트로 강화. 온보딩·결과 페이지 배경을 `hero-dark` → `#FAFAF8` 라이트 테마로 전환.

**Tech Stack:** Next.js 14 App Router, React 18, framer-motion 11, Tailwind CSS, TypeScript strict

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| `app/globals.css` | `--navy` CSS 변수 + `.icon-btn-light` 클래스 추가 |
| `components/saju/OhaengStrengthBar.tsx` | 신규: 오행 강도 가로 바 차트 |
| `components/saju/BirthInputForm.tsx` | 전면 재작성: 3단계, 그리드 입력, 24시 시간 그리드 |
| `app/onboarding/page.tsx` | 라이트 배경 전환, 헤더 텍스트 색상 수정 |
| `app/result/ResultClient.tsx` | 라이트 테마, 히어로 오행 바차트, 신강/신약 배지 |

---

## Task 1: CSS 변수 + 아이콘 버튼 클래스 추가

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: `:root`에 `--navy` 변수 추가**

`app/globals.css`의 `:root` 블록 끝에 추가:
```css
/* 딥 네이비 — 모던 미니멀 프라이머리 */
--navy: #1A1A2E;
```

- [ ] **Step 2: `.icon-btn-light` 클래스 추가**

`app/globals.css`의 `.icon-btn-dark:active { ... }` 블록 바로 다음에 추가:
```css
/* ── 헤더 아이콘 버튼 (라이트) ─────────────────────────────── */
.icon-btn-light {
  @apply flex items-center justify-center rounded-full;
  width: 44px;
  height: 44px;
  background: rgba(26, 26, 46, 0.06);
  border: 1px solid rgba(26, 26, 46, 0.10);
  color: #1A1A2E;
  transition: background 150ms ease;
}
.icon-btn-light:hover  { background: rgba(26, 26, 46, 0.10); }
.icon-btn-light:active { transform: scale(0.95); }
```

- [ ] **Step 3: 변경 확인**
```bash
npm run type-check
```
Expected: 오류 없음

- [ ] **Step 4: 커밋**
```bash
git add app/globals.css
git commit -m "style: 딥 네이비 CSS 변수 + icon-btn-light 클래스 추가"
```

---

## Task 2: OhaengStrengthBar 신규 컴포넌트

**Files:**
- Create: `components/saju/OhaengStrengthBar.tsx`

- [ ] **Step 1: 컴포넌트 파일 작성**

```tsx
'use client'

import { motion } from 'framer-motion'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수']

interface OhaengStrengthBarProps {
  strength: Record<Ohaeng, number>
}

export default function OhaengStrengthBar({ strength }: OhaengStrengthBarProps) {
  return (
    <div className="space-y-2.5">
      {OHAENG_ORDER.map((o, idx) => {
        const pct = Math.round(strength[o])
        const color = OHAENG_COLOR[o]
        return (
          <div key={o} className="flex items-center gap-2">
            <span
              className="text-xs font-semibold w-12 text-right tabular-nums"
              style={{ color: color.text }}
            >
              {OHAENG_EMOJI[o]} {o}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color.hex }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: idx * 0.08, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs tabular-nums w-8 text-right" style={{ color: '#6E6A7A' }}>
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**
```bash
npm run type-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**
```bash
git add components/saju/OhaengStrengthBar.tsx
git commit -m "feat: OhaengStrengthBar 오행 강도 바 차트 컴포넌트 추가"
```

---

## Task 3: BirthInputForm 전면 재작성

**Files:**
- Modify: `components/saju/BirthInputForm.tsx`

**핵심 로직:**
- Step 0: 이름 + 성별 (딥 네이비 CTA)
- Step 1: 생년월일 — 연도 입력 → 유효 시 월 그리드(4×3) 등장 → 월 선택 시 일 그리드(7×5) 등장 → 일 선택 600ms 후 Step 2 자동 이동
- Step 2: 0~23시 그리드(6×4) + 지시(地支) 실시간 안내 + 운 선택(2×3)
- `hour` 값은 0~23 정수 그대로 API 전달 (엔진이 지시 변환 담당)

**Hour → 지시 매핑 (engine.ts와 동일 로직):**
```
hour === 23 → 子(자)  |  0 → 子(자)  |  1,2 → 丑(축)
3,4 → 寅(인)  |  5,6 → 卯(묘)  |  7,8 → 辰(진)
9,10 → 巳(사)  |  11,12 → 午(오)  |  13,14 → 未(미)
15,16 → 申(신)  |  17,18 → 酉(유)  |  19,20 → 戌(술)
21,22 → 亥(해)
```

- [ ] **Step 1: 파일 전체 교체**

`components/saju/BirthInputForm.tsx`를 아래 내용으로 교체:

```tsx
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
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState<number | null>(null)
  const [day, setDay]         = useState<number | null>(null)
  const [showMonth, setShowMonth] = useState(false)
  const [showDay, setShowDay]     = useState(false)

  // Step 2
  const [hour, setHour]               = useState<number | null>(null)
  const [luckPreference, setLuck]     = useState<string | null>(null)

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

  const selectedJisiIdx  = hour !== null ? getJisiIdx(hour) : null
  const selectedJisiKr   = selectedJisiIdx !== null ? JISI_KR[selectedJisiIdx]    : null
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
                    const selected   = hour === i
                    const jisiHanja  = JISI_HANJA[getJisiIdx(i)]
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
```

- [ ] **Step 2: 타입 체크**
```bash
npm run type-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**
```bash
git add components/saju/BirthInputForm.tsx
git commit -m "feat: BirthInputForm 3단계 재작성 — 그리드 입력 + 24시 정밀 시간"
```

---

## Task 4: 온보딩 페이지 라이트 테마 전환

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BirthInputForm, { type BirthFormData } from '@/components/saju/BirthInputForm'
import { useUserStore } from '@/store/user-store'

export default function OnboardingPage() {
  const router  = useRouter()
  const setSaju = useUserStore((s) => s.setSaju)
  const [isLoading, setLoading] = useState(false)
  const [isError, setError]     = useState(false)

  const handleBirthSubmit = useCallback(async (data: BirthFormData) => {
    setLoading(true)
    setError(false)
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
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [setSaju, router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF8' }}>

      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="icon-btn-light"
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

        <div className="text-center">
          <p
            className="font-bold text-base tracking-tight"
            style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
          >
            명당지도
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#C9973A' }}>오행 분석</p>
        </div>

        <div className="w-11" />
      </header>

      {/* 타이틀 */}
      <div className="text-center px-6 py-4">
        <h1
          className="text-xl font-semibold mb-1.5 leading-snug break-keep"
          style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
        >
          내 사주로{' '}
          <span style={{ color: '#C9973A' }}>맞춤 명당</span>을 찾아드려요
        </h1>
        <p className="text-xs break-keep" style={{ color: '#6E6A7A' }}>
          생년월일 입력 → 오행 분석 → 풍수 명당 추천
        </p>
      </div>

      {/* 폼 카드 */}
      <div
        className="flex-1 bg-white rounded-t-3xl pt-6 pb-safe overflow-y-auto"
        style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.05)' }}
      >
        <BirthInputForm onSubmit={handleBirthSubmit} isLoading={isLoading} />
        {isError && (
          <div className="mt-3 mx-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
            분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크 + 서버 실행 확인**
```bash
npm run type-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**
```bash
git add app/onboarding/page.tsx
git commit -m "style: 온보딩 페이지 라이트 테마 전환 (#FAFAF8 배경)"
```

---

## Task 5: ResultClient 라이트 테마 + 히어로 오행 바차트

**Files:**
- Modify: `app/result/ResultClient.tsx`

**변경 범위:**
1. `hero-dark` → `style={{ background: '#FAFAF8' }}`
2. 헤더: `icon-btn-dark` → `icon-btn-light`, 텍스트 색상 `#1A1A2E`
3. 히어로 섹션: 다크 텍스트 → 라이트 카드 (일간 한자 + 오행 바차트 + 용신/희신 칩 + 신강/신약 배지)
4. 콘텐츠 섹션: parchment 배경 제거 (흰 카드만 유지)

- [ ] **Step 1: 히어로 섹션 교체 — ResultClient.tsx 상단 import에 OhaengStrengthBar 추가**

`ResultClient.tsx` import 블록 끝에 추가:
```tsx
import OhaengStrengthBar from '@/components/saju/OhaengStrengthBar'
```

- [ ] **Step 2: 외부 래퍼 + 헤더 라이트 테마로 교체**

`<div className="min-h-screen hero-dark pb-safe flex flex-col">` 를:
```tsx
<div className="min-h-screen pb-safe flex flex-col" style={{ background: '#FAFAF8' }}>
```
으로 교체.

헤더 내 `icon-btn-dark` 두 곳을 `icon-btn-light`으로 교체.

`<p className="text-white font-semibold text-base"` 를:
```tsx
<p className="font-semibold text-base" style={{ color: '#1A1A2E', fontFamily: 'Noto Serif KR, Georgia, serif' }}>
```
으로 교체.

- [ ] **Step 3: 히어로 섹션 교체**

현재 `<motion.div className="text-center px-6 py-6 flex-shrink-0" ...>` 블록 전체(닫는 `</motion.div>`까지)를 아래로 교체:

```tsx
<motion.div
  className="px-4 py-4 flex-shrink-0"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
>
  <div
    className="rounded-2xl p-5"
    style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
  >
    {/* 이름 + 일간(日干) */}
    <div className="flex items-start justify-between mb-4">
      <div>
        {userName && (
          <p className="text-xs font-semibold mb-1" style={{ color: '#C9973A' }}>
            {userName}님의 사주
          </p>
        )}
        <h1
          className="text-2xl font-semibold leading-tight"
          style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#1A1A2E' }}
        >
          {result.pillars.day.cheongan}
          <span className="text-base font-normal ml-1.5" style={{ color: '#6E6A7A' }}>
            ({result.pillars.day.cheonganKr}{result.pillars.day.cheonganOhaeng})
          </span>
        </h1>
      </div>
      {/* 신강/신약 배지 */}
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full mt-1"
        style={{
          background: result.bodyStrength === 'strong' ? '#EEF2FB' : result.bodyStrength === 'weak' ? '#FFF4F0' : '#F3F3F0',
          color:      result.bodyStrength === 'strong' ? '#1A4CB0' : result.bodyStrength === 'weak' ? '#993C1D' : '#4A4843',
        }}
      >
        {result.bodyStrength === 'strong' ? '신강(身强)' : result.bodyStrength === 'weak' ? '신약(身弱)' : '중화(中和)'}
      </span>
    </div>

    {/* 오행 강도 바 차트 */}
    <div className="mb-4">
      <OhaengStrengthBar strength={result.ohaengStrength} />
    </div>

    {/* 용신 / 희신 칩 */}
    <div className="flex gap-2 flex-wrap">
      <span
        className="text-xs font-semibold px-3 py-1.5 rounded-full"
        style={{ background: OHAENG_COLOR[result.yongshin].bg, color: OHAENG_COLOR[result.yongshin].text }}
      >
        용신 {OHAENG_EMOJI[result.yongshin]} {result.yongshin}
      </span>
      <span
        className="text-xs font-semibold px-3 py-1.5 rounded-full"
        style={{ background: OHAENG_COLOR[result.heeshin].bg, color: OHAENG_COLOR[result.heeshin].text }}
      >
        희신 {OHAENG_EMOJI[result.heeshin]} {result.heeshin}
      </span>
      {result.hapChung.length > 0 && (
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#FFF4F0', color: '#993C1D' }}>
          ⚡ {result.hapChung[0].type}
        </span>
      )}
    </div>
  </div>
</motion.div>
```

- [ ] **Step 4: 콘텐츠 섹션 배경 수정**

`<div className="flex-1 bg-parchment` 로 시작하는 div가 있다면 `bg-parchment` 제거 후:
```tsx
<div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
```
으로 교체. (콘텐츠 섹션 내부 카드들이 `bg-white rounded-2xl` 유지되는지 확인)

- [ ] **Step 5: 타입 체크**
```bash
npm run type-check
```
Expected: 오류 없음. 오류 발생 시 해당 import/타입 수정.

- [ ] **Step 6: 커밋**
```bash
git add app/result/ResultClient.tsx
git commit -m "feat: ResultClient 라이트 테마 + 오행 바차트 히어로"
```

---

## Task 6: 최종 빌드 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: TypeScript 오류 없음 확인**
```bash
npm run type-check
```
Expected: 오류 0건

- [ ] **Step 2: ESLint 확인**
```bash
npm run lint
```
Expected: 경고 없음 또는 무시 가능한 수준

- [ ] **Step 3: 프로덕션 빌드 성공 확인**
```bash
npm run build
```
Expected: `✓ Compiled successfully`, Route 오류 없음

- [ ] **Step 4: 사주 엔진 테스트 통과 확인**
```bash
cat > /tmp/tsconfig_test.json << 'EOF'
{"compilerOptions":{"target":"ES2020","module":"commonjs","moduleResolution":"node","lib":["ES2020","dom"],"types":["node"],"strict":true,"esModuleInterop":true}}
EOF
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```
Expected: 모든 테스트 통과, 0 failed

- [ ] **Step 5: 최종 커밋**
```bash
git add -A
git commit -m "feat: 사주 온보딩 풀 리디자인 완료 — 모던 미니멀 + 24시 그리드 입력"
```

---

## 자기 검토 (Spec Self-Review)

**스펙 커버리지 체크:**
- ✅ 디자인 시스템 (딥 네이비, 오프화이트 배경, 컴포넌트 radius) — Task 1
- ✅ 3단계 온보딩 — Task 3
- ✅ 생년월일 그리드 (월 4×3, 일 7×5) — Task 3
- ✅ 0~23시 정밀 그리드 + 지시 실시간 안내 — Task 3
- ✅ 운 선택 2×3 카드 — Task 3
- ✅ 온보딩 페이지 라이트 배경 — Task 4
- ✅ 결과 히어로 오행 바차트 — Task 5
- ✅ 용신/희신/신강신약 칩 — Task 5
- ✅ 빌드 검증 — Task 6

**타입 일관성 체크:**
- `BirthFormData` — Task 3에서 정의, onboarding/page.tsx (Task 4)에서 import
- `OhaengStrengthBar` props: `strength: Record<Ohaeng, number>` → `result.ohaengStrength` (Task 5에서 사용)
- `result.pillars.day.cheongan`, `.cheonganKr`, `.cheonganOhaeng` — `types.ts` Pillar 인터페이스에 정의됨 ✅
- `result.bodyStrength` — `'strong' | 'weak' | 'balanced'` ✅
- `result.hapChung[0].type` — `HapChungItem`의 `type` 필드 확인 필요 (Task 5 Step 3에서 `hapChung.length > 0` 가드로 안전)
