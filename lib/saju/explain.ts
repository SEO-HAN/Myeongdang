/**
 * 사주 결과 개인화 텍스트 생성
 * 사용자 언어로 사주를 설명하는 서사 텍스트 생성 유틸
 */

import type { SajuResult, Ohaeng } from './types'
import { OHAENG_EMOJI, OHAENG_LUCK } from './types'

const OHAENG_SUPPLEMENT: Record<Ohaeng, string> = {
  목: '성장 에너지와 도전 의식',
  화: '열정과 명예 운',
  토: '안정감과 재물 운',
  금: '결단력과 금전 운',
  수: '지혜와 인간관계 운',
}

const BODY_STRENGTH_DESC: Record<string, string> = {
  strong: '기운이 넘치는',
  weak: '섬세하고 균형을 추구하는',
  balanced: '조화로운',
}

/**
 * 사주 서사 텍스트 생성
 * "[이름]님은 [오행] 기운이 강한 사주예요. [약한오행] 보충이 필요해요."
 */
export function buildSajuNarrative(result: SajuResult, name?: string): string {
  const prefix = name ? `${name}님은` : '당신은'
  const strong = result.strongOhaeng[0] as Ohaeng
  const weak = result.weakOhaeng[0] as Ohaeng
  const bodyDesc = BODY_STRENGTH_DESC[result.bodyStrength] ?? '개성 있는'

  return (
    `${prefix} ${OHAENG_EMOJI[strong]} ${strong} 기운이 강하고 ${bodyDesc} 사주예요. ` +
    `${OHAENG_EMOJI[weak]} ${weak} 기운의 ${OHAENG_SUPPLEMENT[weak]}을 보충하면 더 큰 에너지를 발휘할 수 있어요.`
  )
}

/**
 * 용신 설명 텍스트
 */
export function buildYongshinNarrative(result: SajuResult, name?: string): string {
  const prefix = name ? `${name}님` : '당신'
  return (
    `${prefix}에게 지금 가장 필요한 기운은 ${OHAENG_EMOJI[result.yongshin]} ${result.yongshin}(이)에요. ` +
    `${result.yongshin} 기운이 강한 명당을 방문하면 균형과 운이 열립니다.`
  )
}

/**
 * 장소 추천 이유 텍스트 (1줄)
 */
export function buildPlaceNarrative(
  placeName: string,
  placeOhaeng: string[],
  result: SajuResult,
): string {
  const matchWeak = placeOhaeng.filter((o) => result.weakOhaeng.includes(o as Ohaeng))
  const matchYong = placeOhaeng.includes(result.yongshin)

  if (matchYong) {
    return `${placeName}의 ${result.yongshin} 기운이 당신의 용신을 직접 채워줍니다`
  }
  if (matchWeak.length > 0) {
    return `부족한 ${matchWeak[0]} 기운을 ${placeName}에서 보충할 수 있어요`
  }
  return `${placeName}의 기운이 당신의 사주와 조화를 이룹니다`
}

/**
 * 장소 추천 상세 서사 텍스트 (2~3문장)
 * 용신/약한 오행/운 선호도 매칭에 따라 개인화된 설명 생성
 */
export function buildDetailedPlaceNarrative(
  place: { name: string; ohaeng: string[]; reason_text: string },
  result: SajuResult,
  luckPreference?: string,
): string {
  const matchWeak = place.ohaeng.filter((o) => result.weakOhaeng.includes(o as Ohaeng))
  const matchYong = place.ohaeng.includes(result.yongshin)
  const matchLuck = luckPreference
    ? place.ohaeng.some((o) => {
        const lucks = OHAENG_LUCK[o as Ohaeng]
        return lucks?.includes(luckPreference)
      })
    : false

  let narrative = ''

  if (matchYong) {
    // 용신 매칭 — 가장 강한 추천 이유
    narrative = `이 장소의 ${OHAENG_EMOJI[result.yongshin]} ${result.yongshin} 기운은 당신에게 가장 필요한 용신 에너지입니다. ${place.name}을 방문하면 ${result.yongshin} 기운이 직접 보충되어 운의 흐름이 좋아집니다.`
  } else if (matchWeak.length > 0) {
    // 약한 오행 매칭
    const weakOhaeng = matchWeak[0] as Ohaeng
    const reasonRef = place.reason_text ? ` ${place.reason_text}.` : ''
    narrative = `당신에게 부족한 ${OHAENG_EMOJI[weakOhaeng]} ${weakOhaeng} 기운을 ${place.name}의 자연 에너지가 채워줍니다.${reasonRef} 정기적으로 방문하면 균형이 회복됩니다.`
  } else {
    // 매칭 없음 — 범용 서사
    narrative = `이 장소의 기운이 당신의 사주와 자연스러운 조화를 이루어 마음의 안정을 줍니다.`
  }

  // 운 선호도 매칭 시 추가 문장
  if (matchLuck && luckPreference) {
    narrative += ` 특히 당신이 원하는 ${luckPreference}에 좋은 기운이 흐르는 곳이에요.`
  }

  return narrative
}
