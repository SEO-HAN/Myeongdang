/**
 * QuickTestForm — 오행 결핍 5문항 퀵 테스트
 *
 * 생년월일 없이도 부족 오행을 추정해 지도 필터 적용
 * 각 선택지는 오행 결핍 시그널에 매핑
 * 완료 후 "더 정확한 분석" CTA로 /onboarding 유도
 */
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { cn } from '@/lib/utils'
import type { Ohaeng } from '@/lib/saju/types'

// ─────────────────────────────────────────────
// 문항 정의
// ─────────────────────────────────────────────
interface QuizOption {
  text: string
  emoji: string
  ohaeng: Ohaeng
}

interface QuizQuestion {
  q: string
  options: QuizOption[]
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: '요즘 가장 부족하게 느껴지는 것은?',
    options: [
      { text: '의욕과 열정, 추진력',    emoji: '🔥', ohaeng: '화' },
      { text: '돈과 재물의 흐름',        emoji: '💰', ohaeng: '금' },
      { text: '건강과 생명력',           emoji: '🌱', ohaeng: '목' },
      { text: '마음의 안정과 뿌리',      emoji: '🏡', ohaeng: '토' },
      { text: '지혜와 유연한 사고',      emoji: '💧', ohaeng: '수' },
    ],
  },
  {
    q: '최근 가장 자주 겪는 상황은?',
    options: [
      { text: '일이 잘 안 풀리고 막힌다',   emoji: '🚧', ohaeng: '화' },
      { text: '돈이 모이질 않고 새어나간다', emoji: '💸', ohaeng: '금' },
      { text: '자주 피곤하고 몸이 무겁다',   emoji: '😮‍💨', ohaeng: '목' },
      { text: '불안하고 흔들리는 느낌',      emoji: '😰', ohaeng: '토' },
      { text: '인간관계가 복잡하고 힘들다',  emoji: '😶', ohaeng: '수' },
    ],
  },
  {
    q: '올해 가장 이루고 싶은 소원은?',
    options: [
      { text: '사업/직장 성공과 승진',    emoji: '📈', ohaeng: '화' },
      { text: '재물 증가와 부의 실현',    emoji: '💎', ohaeng: '금' },
      { text: '건강 회복과 활력 충전',    emoji: '💪', ohaeng: '목' },
      { text: '가정 안정과 내 집 마련',   emoji: '🏠', ohaeng: '토' },
      { text: '좋은 인연과 연애/결혼',    emoji: '💕', ohaeng: '수' },
    ],
  },
  {
    q: '나의 성격 중 가장 보완하고 싶은 점은?',
    options: [
      { text: '실행력 부족 — 결심해도 못 움직인다', emoji: '🐢', ohaeng: '화' },
      { text: '우유부단 — 결론을 못 내린다',        emoji: '🤔', ohaeng: '금' },
      { text: '의지력 부족 — 작심삼일 반복',        emoji: '😩', ohaeng: '목' },
      { text: '감정 기복 — 쉽게 흔들린다',          emoji: '🌊', ohaeng: '토' },
      { text: '경직됨 — 상황에 유연하지 못하다',    emoji: '🪨', ohaeng: '수' },
    ],
  },
  {
    q: '지금 나에게 필요한 에너지는?',
    options: [
      { text: '변화를 만드는 뜨거운 에너지',   emoji: '🔆', ohaeng: '화' },
      { text: '재물을 끌어모으는 강한 에너지', emoji: '⚡', ohaeng: '금' },
      { text: '성장과 회복의 생명 에너지',     emoji: '🌿', ohaeng: '목' },
      { text: '안정과 뿌리내림의 에너지',      emoji: '🏔️', ohaeng: '토' },
      { text: '지혜와 흐름의 물 에너지',       emoji: '🌊', ohaeng: '수' },
    ],
  },
]

// ─────────────────────────────────────────────
// 오행 점수 집계 → 부족 오행 2개 추출
// ─────────────────────────────────────────────
function calcWeakOhaeng(answers: Ohaeng[]): Ohaeng[] {
  const scores: Record<Ohaeng, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  answers.forEach((o) => { scores[o]++ })
  return (Object.entries(scores) as [Ohaeng, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([o]) => o)
}

export default function QuickTestForm() {
  const router = useRouter()
  const setFilter = useUserStore((s) => s.setOhaengFilter)
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState<Ohaeng[]>([])
  const [selected, setSelected] = useState<Ohaeng | null>(null)
  const [isDone, setIsDone]     = useState(false)
  const [weakOhaeng, setWeak]   = useState<Ohaeng[]>([])

  const handleSelect = useCallback((o: Ohaeng) => {
    setSelected(o)
    const newAnswers = [...answers, o]

    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setAnswers(newAnswers)
        setSelected(null)
        setCurrent((c) => c + 1)
      } else {
        const weak = calcWeakOhaeng(newAnswers)
        setWeak(weak)
        setIsDone(true)
        setFilter(weak)
      }
    }, 300)
  }, [current, answers, setFilter])

  if (isDone) {
    return (
      <motion.div
        className="text-center px-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          분석 완료!
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          당신에게 부족한 오행은
        </p>
        <div className="flex justify-center gap-3 mb-8">
          {weakOhaeng.map((o) => {
            const c = OHAENG_COLOR[o]
            return (
              <div
                key={o}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl"
                style={{ background: c.bg }}
              >
                <span className="text-4xl">{OHAENG_EMOJI[o]}</span>
                <span className="text-lg font-bold" style={{ color: c.text }}>{o}(五行)</span>
              </div>
            )
          })}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-4 rounded-2xl bg-brand text-white font-bold text-base shadow-md mb-3"
        >
          🗺️ 내 오행 맞춤 명당 보러 가기
        </button>
        <a
          href="/onboarding"
          className="block w-full py-3 text-sm text-gray-500 underline underline-offset-2 text-center"
        >
          생년월일로 더 정확히 분석하기 →
        </a>
      </motion.div>
    )
  }

  const q = QUESTIONS[current]

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* 진행 바 */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Q{current + 1} / {QUESTIONS.length}</span>
          <span>{Math.round(((current) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            animate={{ width: `${(current / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 질문 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-base font-bold text-gray-900 mb-5 text-center">
            {q.q}
          </h2>
          <div className="flex flex-col gap-2.5">
            {q.options.map((opt) => (
              <button
                key={opt.ohaeng}
                onClick={() => handleSelect(opt.ohaeng)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150',
                  selected === opt.ohaeng
                    ? 'bg-brand/10 border-brand scale-[0.98]'
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <span className="text-2xl w-8 text-center">{opt.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{opt.text}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
