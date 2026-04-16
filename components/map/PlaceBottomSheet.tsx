/**
 * PlaceBottomSheet — 장소 상세 바텀시트
 *
 * mockup.html 기반 완전 구현:
 *  이미지 + 오행 뱃지 → 신뢰도 바 → 근거 텍스트 → SNS 카드 → CTA
 *
 * UX:
 *  - framer-motion drag="y" 스와이프 닫기
 *  - 백드롭 탭 닫기
 *  - 카카오맵 딥링크 / 북마크 / 카카오톡 공유
 */
'use client'

import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import Image from 'next/image'
import {
  useSelectedPlace,
  useUserStore,
} from '@/store/user-store'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { cn, getOhaengHanja, SNS_EMOJI } from '@/lib/utils'
import type { Ohaeng } from '@/lib/saju/types'

// ─────────────────────────────────────────────
// 서브 컴포넌트: 오행 칩
// ─────────────────────────────────────────────
function OhaengChip({ ohaeng }: { ohaeng: Ohaeng }) {
  const color = OHAENG_COLOR[ohaeng]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {OHAENG_EMOJI[ohaeng]} {ohaeng}({getOhaengHanja(ohaeng)})
    </span>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 신뢰도 바
// ─────────────────────────────────────────────
function TrustBar({ score }: { score: number }) {
  const color =
    score >= 90 ? '#E8593C'
    : score >= 75 ? '#BA7517'
    : '#888780'

  const label =
    score >= 90 ? '최고 명당'
    : score >= 75 ? '검증 명당'
    : '추천 명당'

  return (
    <div className="flex items-center gap-2 my-2">
      <span className="text-[10px] text-gray-400 shrink-0">신뢰도</span>
      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span
        className="text-[11px] font-semibold shrink-0"
        style={{ color }}
      >
        {score}점 · {label}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: SNS 큐레이션 카드
// ─────────────────────────────────────────────
function SnsCard({ url, author, snippet, snsType }: {
  url: string
  author?: string
  snippet?: string
  snsType: string
}) {
  const primaryOhaeng: Ohaeng = 'hwa' as never // fallback
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-base">
        {SNS_EMOJI[snsType] ?? '📎'}
      </div>
      <div className="flex-1 min-w-0">
        {author && (
          <p className="text-xs font-medium text-gray-800 truncate">{author}</p>
        )}
        {snippet && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5">"{snippet}"</p>
        )}
      </div>
      <span className="text-gray-300 text-sm shrink-0">↗</span>
    </a>
  )
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function PlaceBottomSheet() {
  const { place, isOpen } = useSelectedPlace()
  const closePlace   = useUserStore((s) => s.closePlace)
  const toggleBookmark = useUserStore((s) => s.toggleBookmark)
  const isBookmarked   = useUserStore((s) => s.isBookmarked)

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePlace()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePlace])

  // 스와이프 핸들러
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 80 || info.velocity.y > 400) closePlace()
    },
    [closePlace],
  )

  // 카카오톡 공유
  const handleShare = useCallback(() => {
    if (!place) return
    const shareUrl = `${window.location.origin}/place/${place.id}`
    const primaryOhaeng = place.ohaeng[0] as Ohaeng
    const emoji = OHAENG_EMOJI[primaryOhaeng]

    if (typeof window !== 'undefined' && (window as any).Kakao?.isInitialized?.()) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${emoji} ${place.name} — 명당지도`,
          description: place.description_short,
          imageUrl: place.image_urls[0] ?? '',
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          { title: '명당 보러 가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
        ],
      })
    } else {
      // 폴백: 클립보드 복사
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('링크가 복사됐습니다!')
      })
    }
  }, [place])

  return (
    <AnimatePresence>
      {isOpen && place && (
        <>
          {/* 백드롭 */}
          <motion.div
            className="fixed inset-0 z-20 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlace}
          />

          {/* 바텀시트 */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-bottom max-h-[88vh] overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* 스크롤 영역 */}
            <div className="overflow-y-auto overscroll-contain pb-safe pb-8">

              {/* 이미지 영역 */}
              <div className="relative h-44 bg-gradient-to-br from-slate-700 to-slate-500 mx-0">
                {place.image_urls[0] && (
                  <Image
                    src={place.image_urls[0]}
                    alt={place.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, 480px"
                    priority
                  />
                )}
                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

                {/* 오행 + 검증 뱃지 */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {place.ohaeng.map((o) => {
                    const ohaeng = o as Ohaeng
                    const hex = OHAENG_COLOR[ohaeng]?.hex ?? '#888'
                    return (
                      <span
                        key={o}
                        className="text-xs px-2.5 py-1 rounded-full font-semibold text-white backdrop-blur-sm"
                        style={{ backgroundColor: `${hex}CC` }}
                      >
                        {OHAENG_EMOJI[ohaeng]} {o}({getOhaengHanja(ohaeng)}) 기운
                      </span>
                    )
                  })}
                  {place.expert_verified && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white bg-black/50 backdrop-blur-sm">
                      ⭐ 전문가 검증
                    </span>
                  )}
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={closePlace}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center text-base hover:bg-black/60 transition-colors"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="px-4 pt-4">

                {/* 장소명 + 주소 */}
                <h2 className="text-[17px] font-semibold text-gray-900 mb-1">
                  {place.name}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  📍 {place.address}
                </p>

                {/* 오행 + 운 칩 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {place.ohaeng.map((o) => (
                    <OhaengChip key={o} ohaeng={o as Ohaeng} />
                  ))}
                  {place.luck_types.slice(0, 3).map((luck) => (
                    <span
                      key={luck}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                    >
                      {luck}
                    </span>
                  ))}
                </div>

                {/* 신뢰도 바 */}
                <TrustBar score={place.trust_score} />

                <div className="h-px bg-gray-100 my-3" />

                {/* 풍수 근거 텍스트 */}
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  🗺️ 왜 이 사주에 맞는 장소인가
                </p>
                <p className="text-[13px] text-gray-700 leading-relaxed mb-4">
                  {place.reason_text}
                </p>

                {/* SNS 큐레이션 (source_sns 배열 기반 임시 렌더) */}
                {place.source_sns.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 mb-3" />
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      📱 이 장소를 큐레이션한 콘텐츠
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      {place.source_sns.slice(0, 3).map((url, i) => {
                        const snsType = url.includes('youtube') ? '유튜브'
                          : url.includes('instagram') ? '인스타'
                          : url.includes('blog.naver') ? '블로그'
                          : url.includes('news') ? '뉴스'
                          : '블로그'
                        return (
                          <SnsCard
                            key={i}
                            url={url}
                            snsType={snsType}
                            author={i === 0 ? '역술가 큐레이션' : '커뮤니티 공유'}
                            snippet={place.description_short}
                          />
                        )
                      })}
                    </div>
                  </>
                )}

                {/* CTA 버튼 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* 카카오맵 열기 */}
                  <a
                    href={place.kakaomap_url || `https://map.kakao.com/link/search/${encodeURIComponent(place.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🗺️ 카카오맵으로 보기
                  </a>

                  {/* 북마크 */}
                  <button
                    onClick={() => toggleBookmark(place.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-colors',
                      isBookmarked(place.id)
                        ? 'bg-brand text-white'
                        : 'bg-brand text-white hover:bg-brand/90',
                    )}
                  >
                    {isBookmarked(place.id) ? '🔖 저장됨' : '🔖 북마크 저장'}
                  </button>
                </div>

                {/* 카카오톡 공유 */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base">💬</span>
                  카카오톡으로 공유하기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
