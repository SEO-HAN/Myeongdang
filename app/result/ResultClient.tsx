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
import { buildSajuNarrative, buildYongshinNarrative, buildDetailedPlaceNarrative } from '@/lib/saju/explain'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'
import type { ScoredPlace } from '@/lib/saju/recommend'

interface ResultClientProps {
  result: SajuResult
  luckPreference?: string
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

// 오행 분석 섹션 헤더용 별 아이콘
function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

// 점수에 따른 감성 레이블 반환
function getScoreLabel(score: number): string {
  if (score >= 90) return '완벽한 궁합!'
  if (score >= 80) return '최고의 선택'
  if (score >= 70) return '강력 추천'
  if (score >= 60) return '잘 맞아요'
  return '괜찮은 선택'
}

export default function ResultClient({ result, luckPreference: luckProp }: ResultClientProps) {
  const router          = useRouter()
  const setSaju         = useUserStore((s) => s.setSaju)
  const userName        = useUserStore((s) => s.userName)
  const luckStored      = useUserStore((s) => s.luckPreference)
  const luckPreference  = luckProp ?? luckStored ?? undefined
  const [copied, setCopied]         = useState(false)
  const [topPlaces, setTopPlaces]   = useState<ScoredPlace[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true)

  const narrative         = buildSajuNarrative(result, userName ?? undefined)
  const yongshinNarrative = buildYongshinNarrative(result, userName ?? undefined)

  useEffect(() => {
    setSaju(result.input)
    useUserStore.persist.rehydrate()
  }, [setSaju, result.input])

  // 추천 명당 TOP3 fetch
  useEffect(() => {
    const { year, month, day, hour } = result.input
    const url = `/api/recommend?y=${year}&m=${month}&d=${day}${hour !== undefined ? `&h=${hour}` : ''}${luckPreference ? `&luck=${encodeURIComponent(luckPreference)}` : ''}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.recommendations) setTopPlaces(data.recommendations.slice(0, 3))
      })
      .catch(() => {}) // 추천 실패해도 페이지 동작
      .finally(() => setIsLoadingPlaces(false))
  }, [result.input, luckPreference])

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

        {/* 나만의 명당 TOP3 — 풀폭 카드 */}
        {isLoadingPlaces ? (
          /* 스켈레톤 로딩 UI */
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <span style={{ color: '#C9973A' }}><MapPinIcon /></span>
              <p className="section-label">나만의 명당 TOP 3</p>
            </div>
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-16 bg-gray-200" />
                  <div className="bg-white px-4 py-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded-full" />
                    <div className="h-12 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : topPlaces.length > 0 ? (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <span style={{ color: '#C9973A' }}><MapPinIcon /></span>
              <p className="section-label">나만의 명당 TOP {topPlaces.length}</p>
            </div>

            {/* 지도에서 보기 CTA */}
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold mb-4 transition-all"
              style={{ background: 'linear-gradient(135deg, #1A1824 0%, #2D2840 100%)', color: '#F0EAD8' }}
            >
              <MapPinIcon />
              지도에서 내 명당 보기
            </a>

            <div className="flex flex-col gap-4">
              {topPlaces.map(({ place, score, matchReasons }, i) => {
                const ohaeng = (place.ohaeng[0] ?? '목') as Ohaeng
                const color = OHAENG_COLOR[ohaeng]
                const detailedNarrative = buildDetailedPlaceNarrative(
                  { name: place.name, ohaeng: place.ohaeng, reason_text: place.reason_text },
                  result,
                  luckPreference,
                )
                return (
                  <motion.div
                    key={place.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ boxShadow: 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 16px, rgba(0,0,0,0.10) 0px 8px 32px' }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    {/* 오행 그라디언트 헤더 */}
                    <div
                      className="px-4 py-5 flex items-center gap-3"
                      style={{
                        background: `linear-gradient(135deg, ${color.hex}22 0%, ${color.bg} 100%)`,
                      }}
                    >
                      <span className="text-3xl">{OHAENG_EMOJI[ohaeng]}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-base truncate"
                          style={{ color: '#1A1824', fontFamily: 'Noto Serif KR, Georgia, serif' }}
                        >
                          {place.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: color.hex + '22', color: color.hex }}
                        >
                          #{i + 1}
                        </span>
                        {place.ohaeng.map((o) => (
                          <span
                            key={o}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: OHAENG_COLOR[o as Ohaeng].bg, color: OHAENG_COLOR[o as Ohaeng].text }}
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 카드 본문 */}
                    <div className="bg-white px-4 py-4">
                      {/* 궁합 프로그레스 바 */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: '#6E6A7A' }}>
                            당신과의 궁합
                          </span>
                          {/* 점수 + 감성 레이블 */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold" style={{ color: color.hex }}>
                              {score}%
                            </span>
                            <span className="text-xs font-medium" style={{ color: color.hex, opacity: 0.8 }}>
                              {getScoreLabel(score)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color.hex }}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* 매칭 이유 태그 */}
                      {matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {matchReasons.slice(0, 2).map((reason, ri) => (
                            <span
                              key={ri}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 개인화 추천 이유 */}
                      <p className="text-sm leading-relaxed mb-3" style={{ color: '#444' }}>
                        {detailedNarrative}
                      </p>

                      {/* 하단 액션 */}
                      <div className="flex items-center gap-2">
                        {place.kakaomap_url && (
                          <a
                            href={place.kakaomap_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{ background: color.bg, color: color.text }}
                          >
                            <MapPinIcon /> 길찾기
                          </a>
                        )}
                        <a
                          href={`/place/${place.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors"
                          style={{ borderColor: 'rgba(0,0,0,0.08)', color: '#6E6A7A' }}
                        >
                          상세 보기
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="section-divider" />

        {/* 오행 분석 카드 — 접기/펼치기 모드 */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span style={{ color: '#C9973A' }}><StarIcon /></span>
            <p className="section-label">오행 분석</p>
          </div>
          <OhaengResultCard result={result} onShare={handleCopyLink} collapsible />
        </div>

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
