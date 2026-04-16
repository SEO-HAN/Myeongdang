/**
 * 사주 결과 개인화 텍스트 생성
 * 사용자 언어로 사주를 설명하는 서사 텍스트 생성 유틸
 */

import type { SajuResult, Ohaeng } from './types'
import { OHAENG_EMOJI } from './types'

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
