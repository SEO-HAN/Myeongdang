/**
 * 명당 추천 점수 계산 로직
 * 사주 분석 결과 기반 장소 추천 점수 + 이유 생성
 */

import type { SajuResult, Ohaeng } from './types'
import { buildPlaceNarrative } from './explain'
import { getTodayIlshin } from './ilshin'
import type { PlaceRow } from '@/types/database'

export interface ScoredPlace {
  place: PlaceRow
  score: number
  matchReasons: string[]
}

/**
 * 단일 장소의 추천 점수 계산
 *
 * 기본: trust_score
 * + weakOhaeng 일치 × 15점 (최대 30점)
 * + yongshin 일치 × 20점
 * + luckPreference 일치 × 10점
 * - hapChung 충돌 발생 시 -5점
 */
export function scorePlace(
  place: PlaceRow,
  result: SajuResult,
  luckPreference?: string,
): ScoredPlace {
  let score = place.trust_score
  const reasons: string[] = []

  // 약한 오행 매칭 (최대 30점)
  const weakMatches = place.ohaeng.filter((o) => result.weakOhaeng.includes(o as Ohaeng))
  if (weakMatches.length > 0) {
    score += Math.min(weakMatches.length * 15, 30)
    reasons.push(`부족한 ${weakMatches.join('·')} 기운 보충`)
  }

  // 용신 오행 매칭 (20점)
  if (place.ohaeng.includes(result.yongshin)) {
    score += 20
    reasons.push(`용신 ${result.yongshin} 기운 직접 보충`)
  }

  // 운 선호도 일치 (10점)
  if (luckPreference && place.luck_types.includes(luckPreference)) {
    score += 10
    reasons.push(`원하는 ${luckPreference} 에너지`)
  }

  // 합충 페널티: 지지충 결과 오행이 장소 오행과 일치하면 -5점
  if (result.hapChung.length > 0) {
    const hasConflict = result.hapChung.some(
      (hc) => hc.type === 'jijiChung' && hc.resultOhaeng && place.ohaeng.includes(hc.resultOhaeng),
    )
    if (hasConflict) score -= 5
  }

  return {
    place,
    score: Math.min(100, Math.round(score)),
    matchReasons:
      reasons.length > 0
        ? reasons
        : [buildPlaceNarrative(place.name, place.ohaeng, result)],
  }
}

/**
 * 장소 목록에서 추천 순위 정렬
 */
export function rankPlaces(
  places: PlaceRow[],
  result: SajuResult,
  luckPreference?: string,
): ScoredPlace[] {
  return places
    .map((p) => scorePlace(p, result, luckPreference))
    .sort((a, b) => b.score - a.score)
}

/**
 * 오늘의 추천 명당 — 일진 + 사주 기반 1곳
 * 일진 오행이 장소 오행에 포함되면 bonus +15점
 */
export function getDailyRecommendation(
  places: PlaceRow[],
  result: SajuResult,
  luckPreference?: string,
): ScoredPlace | null {
  const ilshin = getTodayIlshin()
  const todayOhaeng = ilshin.dayPillar.cheonganOhaeng // 오늘 천간의 오행

  const scored = places.map((p) => {
    const base = scorePlace(p, result, luckPreference)
    // 오늘 일진 오행과 장소 오행이 일치하면 보너스
    if (todayOhaeng && p.ohaeng.includes(todayOhaeng)) {
      return { ...base, score: Math.min(100, base.score + 15) }
    }
    return base
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0] ?? null
}
