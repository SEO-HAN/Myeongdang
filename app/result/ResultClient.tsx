/**
 * ResultClient — 결과 페이지 인터랙티브 클라이언트 파트 (DESIGN.md 기반 리디자인)
 *
 * 개선 사항:
 *  - 다크 히어로: hero-dark 클래스 (따뜻한 인디고, generic slate 제거)
 *  - 헤딩: Noto Serif KR
 *  - UI 아이콘: SVG (이모지 chrome 제거)
 *  - 섹션 라벨: section-label 클래스 + section-divider
 *  - 카드 영역: parchment 배경
 */
'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import OhaengResultCard from '@/components/saju/OhaengResultCard'
import ShareCardButton from '@/components/share/ShareCard'
import IlshinBanner from '@/components/saju/IlshinBanner'
import { useUserStore } from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { buildSajuNarrative, buildYongshinNarrative } from '@/lib/saju/explain'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'
import type { ScoredPlace } from '@/lib/saju/recommend'

interface ResultClientProps {
  result: SajuResult
}

// ── SVG 아이콘 ────────────────────────────────────────────────
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function ResultClient({ result }: ResultClientProps) {
  const router    = useRouter()
  const setSaju   = useUserStore((s) => s.setSaju)
  const userName  = useUserStore((s) => s.userName)
  const [copied, setCopied]     = useState(false)
  const [topPlaces, setTopPlaces] = useState<ScoredPlace[]>([])

  const narrative         = buildSajuNarrative(result, userName ?? undefined)
  const yongshinNarrative = buildYongshinNarrative(result, userName ?? undefined)

  useEffect(() => {
    setSaju(result.input)
    useUserStore.persist.rehydrate()
  }, [setSaju, result.input])

  // 추천 명당 TOP3 fetch
  useEffect(() => {
    const { year, month, day, hour } = result.input
    const url = `/api/recommend?y=${year}&m=${month}&d=${day}${hour !== undefined ? `&h=${hour}` : ''}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.recommendations) setTopPlaces(data.recommendations.slice(0, 3))
      })
      .catch(() => {}) // 추천 실패해도 페이지 동작
  }, [result.input])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const primaryWeak = result.weakOhaeng[0] as Ohaeng
  const weakColor   = OHAENG_COLOR[primaryWeak]

  return (
    <div className="min-h-screen hero-dark pb-safe flex flex-col">

      {/* ── 헤더 ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-4">
        <button
          onClick={() => router.back()}
          className="icon-btn-dark"
          aria-label="뒤로"
        >
          <ChevronLeftIcon />
        </button>

        <p
          className="text-white font-semibold text-base"
          style={{ fontFamily: 'Noto Serif KR, Georgia, serif' }}
        >
          오행 분석 결과
        </p>

        <button
          onClick={handleCopyLink}
          className="icon-btn-dark"
          aria-label="링크 복사"
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
      </header>

      {/* ── 다크 히어로 — "나는 X가 부족한 사람" ─────────── */}
      <motion.div
        className="text-center px-6 py-6 flex-shrink-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* 오행 이모지 — 의미있는 도메인 콘텐츠이므로 이모지 유지 */}
        <motion.div
          className="text-6xl mb-4 leading-none"
          animate={{ scale: [1, 1.10, 1] }}
          transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
        >
          {OHAENG_EMOJI[primaryWeak]}
        </motion.div>

        {/* 이름 헤더 */}
        {userName && (
          <p className="text-sm font-medium mb-2" style={{ color: '#C9973A' }}>
            {userName}님의 사주
          </p>
        )}

        <h1
          className="text-2xl font-semibold mb-2 leading-snug break-keep"
          style={{
            fontFamily: 'Noto Serif KR, Georgia, serif',
            color: '#F0EAD8',
          }}
        >
          나는{' '}
          <span style={{ color: weakColor.hex }}>
            {result.weakOhaeng.map((o) => `${OHAENG_EMOJI[o as Ohaeng]} ${o}`).join(', ')}
          </span>
          가{'\n'}부족한 사람입니다
        </h1>

        <p className="text-sm mt-2" style={{ color: 'rgba(160,152,149,0.8)' }}>
          {result.pillars.year.cheonganKr}{result.pillars.year.jijiKr}년생
        </p>

        {/* 서사 텍스트 */}
        <p className="text-sm mt-3 leading-relaxed px-2" style={{ color: 'rgba(240,234,216,0.75)' }}>
          {narrative}
        </p>
      </motion.div>

      {/* ── 흰 카드 섹션 — 바텀시트 스타일 ──────────────── */}
      <div
        className="flex-1 bg-parchment rounded-t-sheet px-4 pt-6 pb-8"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.20)' }}
      >

        {/* 오행 분석 카드 */}
        <OhaengResultCard result={result} onShare={handleCopyLink} />

        {/* 용신 섹션 */}
        <div className="mb-4 p-4 rounded-2xl" style={{
          background: OHAENG_COLOR[result.yongshin].bg,
          border: `1.5px solid ${OHAENG_COLOR[result.yongshin].hex}33`,
        }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: OHAENG_COLOR[result.yongshin].hex }}>
            오늘 당신에게 필요한 기운
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{OHAENG_EMOJI[result.yongshin]}</span>
            <span className="font-bold text-lg" style={{ color: OHAENG_COLOR[result.yongshin].text }}>
              {result.yongshin} 기운
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: OHAENG_COLOR[result.yongshin].hex + '22', color: OHAENG_COLOR[result.yongshin].hex }}>
              용신
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: OHAENG_COLOR[result.yongshin].text }}>
            {yongshinNarrative}
          </p>
        </div>

        {/* 추천 명당 TOP3 */}
        {topPlaces.length > 0 && (
          <>
            <div className="section-divider" />
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <span style={{ color: '#C9973A' }}><MapPinIcon /></span>
                <p className="section-label">나만의 명당 TOP {topPlaces.length}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {topPlaces.map(({ place, score, matchReasons }, i) => {
                  const ohaeng = (place.ohaeng[0] ?? '목') as Ohaeng
                  const color = OHAENG_COLOR[ohaeng]
                  return (
                    <a key={place.id} href={`/place/${place.id}`}
                      className="flex items-center gap-3 p-3.5 rounded-2xl transition-colors"
                      style={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 16px',
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: color.bg }}>
                        {OHAENG_EMOJI[ohaeng]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{place.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{matchReasons[0]}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold" style={{ color: color.hex }}>{score}점</span>
                        <span className="text-[10px] text-gray-400">#{i + 1}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div className="section-divider" />

        {/* 오늘의 일진 */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span style={{ color: '#C9973A' }}><MapPinIcon /></span>
            <p className="section-label">오늘의 일진</p>
          </div>
          <IlshinBanner variant="card" defaultExpanded={false} />
        </div>

        <div className="section-divider" />

        {/* 공유 섹션 */}
        <div className="mb-4">
          <p className="section-label text-center mb-3">
            친구와 함께 명당 찾기
          </p>
          <ShareCardButton result={result} />

          <button
            onClick={handleCopyLink}
            className="w-full mt-2 py-3.5 rounded-btn border border-gray-200 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
            style={{ color: copied ? '#C9973A' : '#6E6A7A' }}
          >
            {copied
              ? <><CheckIcon /><span>링크가 복사됐어요</span></>
              : <><LinkIcon /><span>링크 복사하기</span></>
            }
          </button>
        </div>

        {/* 재분석 */}
        <button
          onClick={() => router.push('/onboarding')}
          className="w-full py-3 text-sm text-center cursor-pointer transition-colors"
          style={{ color: '#A09AA8' }}
        >
          다시 분석하기
        </button>
      </div>
    </div>
  )
}
