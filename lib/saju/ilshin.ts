/**
 * 명당지도 — 일진(日辰) 계산 & 개운(開運) 분석 엔진
 *
 * 일진(日辰): 오늘의 일주(日柱) — 해당 날의 천간지지
 * 개운(開運): 사용자 사주의 부족 오행(weakOhaeng)과 오늘의 오행 간
 *             상생(相生)/상극(相克) 관계를 분석하여 '오늘의 운세 등급' 산출
 *
 * 오행 상생(相生): 목→화→토→금→수→목 (순환)
 * 오행 상극(相克): 목→토, 토→수, 수→화, 화→금, 금→목 (순환)
 */

import { calculateSaju } from './engine';
import type { Ohaeng, Pillar } from './types';
import { OHAENG_EMOJI, OHAENG_LUCK } from './types';

// ─────────────────────────────────────────────
// 오행 관계 테이블
// ─────────────────────────────────────────────

/** 상생(相生): key 오행이 생(生)하는 오행 (목생화, 화생토, …) */
const OHAENG_SAENGSAENG: Record<Ohaeng, Ohaeng> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

/** 상극(相克): key 오행이 극(克)하는 오행 (목극토, 토극수, …) */
const OHAENG_GEUK: Record<Ohaeng, Ohaeng> = {
  목: '토',
  화: '금',
  토: '수',
  수: '화',
  금: '목',
};

/** 오행 관계 — A와 B의 관계를 A 기준으로 반환 */
type OhaengRelation = '상생' | '역생' | '상극' | '역극' | '비화';

function getOhaengRelation(a: Ohaeng, b: Ohaeng): OhaengRelation {
  if (a === b) return '비화';
  if (OHAENG_SAENGSAENG[a] === b) return '상생'; // a가 b를 생함
  if (OHAENG_SAENGSAENG[b] === a) return '역생'; // b가 a를 생함 (a가 생을 받음)
  if (OHAENG_GEUK[a] === b) return '상극';        // a가 b를 극함
  if (OHAENG_GEUK[b] === a) return '역극';        // b가 a를 극함 (a가 극을 받음)
  return '비화'; // 나머지 (3단계 이상 관계)
}

// ─────────────────────────────────────────────
// 개운 등급 / 메시지
// ─────────────────────────────────────────────

export type GeunGrade = '대길' | '길' | '평' | '주의' | '흉';

interface GeunGradeInfo {
  grade: GeunGrade;
  score: number; // 0~100
  emoji: string;
  summary: string;
  detail: string;
}

/**
 * weakOhaeng 하나와 오늘 오행 하나의 개운 점수 계산
 * 점수: 비화(80) > 역생(90) > 상생(70) > 비화(60) > 상극(30) > 역극(20)
 *       단, weakOhaeng이 생을 받는(역생) 경우 = 최고 길
 */
function calcSingleGeunScore(weak: Ohaeng, todayO: Ohaeng): number {
  const rel = getOhaengRelation(todayO, weak);
  switch (rel) {
    case '역생': return 95; // 오늘 오행이 내 부족 오행을 생함 → 대길
    case '비화':  return 80; // 같은 오행 → 보강
    case '상생': return 65; // 내 부족 오행이 오늘 오행을 생함 → 길
    case '역극': return 35; // 오늘 오행이 내 부족 오행을 극함 → 주의
    case '상극': return 50; // 내 부족 오행이 오늘 오행을 극함 → 보통
    default:     return 60;
  }
}

function getGradeInfo(score: number, weakOhaeng: Ohaeng[], todayOhaeng: Ohaeng[]): GeunGradeInfo {
  const primaryWeak = weakOhaeng[0];
  const primaryToday = todayOhaeng[0];
  const rel = getOhaengRelation(primaryToday, primaryWeak);

  if (score >= 85) {
    return {
      grade: '대길',
      score,
      emoji: '🌟',
      summary: `오늘은 ${OHAENG_EMOJI[primaryWeak]}${primaryWeak} 기운이 활짝 열리는 날`,
      detail: `${OHAENG_EMOJI[primaryToday]}${primaryToday} 기운이 당신의 ${OHAENG_EMOJI[primaryWeak]}${primaryWeak}을(를) 강하게 도와줍니다. 오늘 명당을 방문하면 효과가 배가됩니다.`,
    };
  } else if (score >= 70) {
    return {
      grade: '길',
      score,
      emoji: '✨',
      summary: `오늘 ${OHAENG_EMOJI[primaryWeak]}${primaryWeak} 운기가 상승하는 날`,
      detail: `오늘의 일진은 당신에게 비교적 좋은 기운입니다. 중요한 일을 추진하기에 좋습니다.`,
    };
  } else if (score >= 50) {
    return {
      grade: '평',
      score,
      emoji: '☁️',
      summary: `평범한 하루, 꾸준함이 힘`,
      detail: `오늘은 특별한 기운의 변화 없이 무난한 날입니다. 일상적인 활동에 집중하세요.`,
    };
  } else if (score >= 35) {
    return {
      grade: '주의',
      score,
      emoji: '⚡',
      summary: `오늘은 ${OHAENG_EMOJI[primaryWeak]}${primaryWeak} 기운이 약해지는 날`,
      detail: `오늘의 기운은 당신의 부족한 오행을 더욱 약하게 만들 수 있습니다. 중요한 결정은 내일로 미루세요.`,
    };
  } else {
    return {
      grade: '흉',
      score,
      emoji: '🌧️',
      summary: `오늘은 에너지를 아끼는 날`,
      detail: `오늘의 기운은 당신의 사주와 충돌합니다. 무리한 계획보다 휴식을 권장합니다.`,
    };
  }
}

// ─────────────────────────────────────────────
// 메인 타입
// ─────────────────────────────────────────────

export interface IlshinResult {
  /** 계산 기준 날짜 (YYYY-MM-DD) */
  date: string;

  /** 오늘의 일주(日柱) */
  dayPillar: Pillar;

  /** 오늘의 오행 [천간오행, 지지오행] — 중복 가능 */
  todayOhaeng: Ohaeng[];

  /** 개운 분석 (weakOhaeng 제공 시만 존재) */
  geun?: {
    score: number;       // 0~100
    grade: GeunGrade;
    emoji: string;
    summary: string;
    detail: string;
    /** 오늘 방문하면 좋은 장소 유형 */
    recommendedLuck: string[];
  };
}

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────

/**
 * 특정 날짜의 일진 계산
 * @param date  대상 날짜 (기본값: 오늘)
 * @param weakOhaeng  사용자의 부족 오행 (개운 분석용, 선택)
 */
export function getIlshin(
  date: Date = new Date(),
  weakOhaeng?: Ohaeng[]
): IlshinResult {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 사주 엔진으로 일주 추출
  const saju = calculateSaju({ year, month, day });
  const dayPillar = saju.pillars.day;

  // 오늘의 오행 추출 (천간 + 지지)
  const todayOhaeng: Ohaeng[] = [
    dayPillar.cheonganOhaeng,
    dayPillar.jijiOhaeng,
  ];

  // 날짜 문자열
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const result: IlshinResult = {
    date: dateStr,
    dayPillar,
    todayOhaeng,
  };

  // 개운 분석 (weakOhaeng 있을 때만)
  if (weakOhaeng && weakOhaeng.length > 0) {
    // weak ohaeng 각각에 대해 점수 계산 후 평균
    const scores = weakOhaeng.flatMap((w) =>
      todayOhaeng.map((t) => calcSingleGeunScore(w, t))
    );
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const gradeInfo = getGradeInfo(avgScore, weakOhaeng, todayOhaeng);

    // 개운 등급에 따른 추천 운 유형
    const recommendedLuck =
      avgScore >= 70
        ? [...new Set(weakOhaeng.flatMap((w) => OHAENG_LUCK[w]))]
        : ['휴식', '명상', '재충전'];

    result.geun = {
      score: avgScore,
      grade: gradeInfo.grade,
      emoji: gradeInfo.emoji,
      summary: gradeInfo.summary,
      detail: gradeInfo.detail,
      recommendedLuck,
    };
  }

  return result;
}

/**
 * 오늘의 일진 (서버/클라이언트 공용)
 */
export function getTodayIlshin(weakOhaeng?: Ohaeng[]): IlshinResult {
  return getIlshin(new Date(), weakOhaeng);
}

/**
 * 날짜 문자열(YYYY-MM-DD)로 일진 계산
 */
export function getIlshinByDateString(
  dateStr: string,
  weakOhaeng?: Ohaeng[]
): IlshinResult {
  const [y, m, d] = dateStr.split('-').map(Number);
  return getIlshin(new Date(y, m - 1, d), weakOhaeng);
}
