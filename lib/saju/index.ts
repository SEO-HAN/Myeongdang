/**
 * 명당지도 사주 엔진 — Public API
 *
 * 사용 예시:
 *
 * ```ts
 * import { calculateSaju, buildOhaengFilter, OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju';
 *
 * const result = calculateSaju({ year: 1990, month: 7, day: 15, hour: 14 });
 *
 * // 오행 분석
 * console.log(result.weakOhaeng);     // ['화', '목']
 * console.log(result.strongOhaeng);   // ['금', '수']
 * console.log(result.ohaengStrength); // { 목: 13, 화: 0, 토: 25, 금: 37, 수: 25 }
 * console.log(result.summary);        // 텍스트 요약
 *
 * // 4기둥
 * console.log(result.pillars.year.label);  // '경오'
 * console.log(result.pillars.month.label); // '계미'
 *
 * // 명당 필터
 * const filter = buildOhaengFilter(result);
 * console.log(filter.targetOhaeng);         // ['화', '목']
 * console.log(filter.recommendedLuckTypes); // ['사업운', '승진운', '건강운', ...]
 * ```
 */

export { calculateSaju, buildOhaengFilter } from './engine';
export {
  OHAENG_EMOJI,
  OHAENG_COLOR,
  OHAENG_LUCK,
  CHEONGAN_LIST,
  CHEONGAN_KR,
  JIJI_LIST,
  JIJI_KR,
} from './types';
export type {
  SajuInput,
  SajuResult,
  Pillar,
  Ohaeng,
  OhaengCount,
  OhaengFilter,
  Cheongan,
  Jiji,
} from './types';

// 일진(日辰) + 개운(開運) 엔진
export { getIlshin, getTodayIlshin, getIlshinByDateString } from './ilshin';
export type { IlshinResult, GeunGrade } from './ilshin';
