/**
 * OhaengResultCard — 사주 오행 분석 결과 카드
 *
 * 구성:
 *  - 4기둥 표 (년주/월주/일주/시주)
 *  - 레이더 차트
 *  - 부족/강한 오행 하이라이트
 *  - 요약 텍스트
 *  - 명당 보러 가기 CTA
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import OhaengRadarChart from './OhaengRadarChart'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { cn } from '@/lib/utils'
import type { SajuResult, Ohaeng } from '@/lib/saju/types'

interface OhaengResultCardProps {
  result: SajuResult
  onShare?: () => void
  compact?: boolean
}

// 오행 강도 바
function OhaengBar({ ohaeng, strength, isWeak, isStrong }: {
  ohaeng: Ohaeng; strength: number; isWeak: boolean; isStrong: boolean
}) {
  const color = OHAENG_COLOR[ohaeng]
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs font-semibold" style={{ color: color.text }}>
        {OHAENG_EMOJI[ohaeng]} {ohaeng}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color.hex }}
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className="w-8 text-xs text-right font-medium text-gray-500">{strength}%</span>
      {isWeak   && <span className="text-[10px] font-bold text-red-400 w-8">부족↓</span>}
      {isStrong && <span className="text-[10px] font-bold text-green-500 w-8">강함↑</span>}
    </div>
  )
}

export default function OhaengResultCard({ result, onShare, compact = false }: OhaengResultCardProps) {
  const { pillars, ohaengStrength, weakOhaeng, strongOhaeng, summary, inputChunWarning } = result

  const pillarsArr = [
    { label: '년주 年柱', pillar: pillars.year },
    { label: '월주 月柱', pillar: pillars.month },
    { label: '일주 日柱', pillar: pillars.day },
    { label: '시주 時柱', pillar: pillars.hour },
  ]

  const ohaengList: Ohaeng[] = ['목', '화', '토', '금', '수']

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 입춘 경고 */}
      {inputChunWarning && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          ⚠️ 입춘(2/4) 이전 출생 — 년주는 전년도 기준으로 계산됐습니다.
        </div>
      )}

      {/* 4기둥 표 */}
      {!compact && (
        <div className="mb-5 bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">사주팔자 四柱八字</p>
          <div className="grid grid-cols-4 gap-1.5">
            {pillarsArr.map(({ label, pillar }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 mb-1.5">{label}</span>
                {pillar ? (
                  <>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mb-1"
                      style={{ background: OHAENG_COLOR[pillar.cheonganOhaeng].hex }}
                    >
                      {pillar.cheonganKr}
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: OHAENG_COLOR[pillar.jijiOhaeng].hex }}
                    >
                      {pillar.jijiKr}
                    </div>
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center col-span-2">
                    <span className="text-[10px] text-gray-400">미입력</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 레이더 차트 + 오행 강도 */}
      <div className="flex items-center gap-4 mb-5">
        <OhaengRadarChart
          strength={ohaengStrength}
          size={160}
          showValues={false}
        />
        <div className="flex-1 flex flex-col gap-2">
          {ohaengList.map((o) => (
            <OhaengBar
              key={o}
              ohaeng={o}
              strength={ohaengStrength[o]}
              isWeak={weakOhaeng.includes(o)}
              isStrong={strongOhaeng.includes(o)}
            />
          ))}
        </div>
      </div>

      {/* 부족 오행 강조 카드 */}
      <div className="bg-gradient-to-r from-brand/10 to-transparent rounded-2xl p-4 mb-4 border border-brand/20">
        <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">
          🎯 보충이 필요한 오행
        </p>
        <div className="flex gap-2 flex-wrap">
          {weakOhaeng.map((o) => {
            const c = OHAENG_COLOR[o]
            return (
              <span
                key={o}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: c.bg, color: c.text }}
              >
                {OHAENG_EMOJI[o]} {o} 기운 부족
              </span>
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{summary}</p>
      </div>

      {/* CTA 버튼 */}
      <div className="flex gap-2">
        <Link
          href={`/?ohaeng=${weakOhaeng.join(',')}`}
          className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-md hover:bg-brand/90 transition-colors"
        >
          🗺️ 내 명당 찾기
        </Link>
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 transition-colors"
          >
            💬 공유
          </button>
        )}
      </div>
    </motion.div>
  )
}
