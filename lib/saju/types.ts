/**
 * 명당지도 — 사주 계산 엔진 타입 정의
 * @version 1.0.0
 */

// ─────────────────────────────────────────────
// 기본 도메인 타입
// ─────────────────────────────────────────────

/** 오행(五行) */
export type Ohaeng = '목' | '화' | '토' | '금' | '수';

/** 오행 이모지 매핑 */
export const OHAENG_EMOJI: Record<Ohaeng, string> = {
  목: '🌿',
  화: '🔥',
  토: '🌏',
  금: '⚡',
  수: '💧',
};

/** 오행 색상 매핑 (Tailwind / HEX) */
export const OHAENG_COLOR: Record<Ohaeng, { bg: string; text: string; hex: string }> = {
  목: { bg: '#EAF3DE', text: '#3B6D11', hex: '#3B6D11' },
  화: { bg: '#FAECE7', text: '#993C1D', hex: '#E8593C' },
  토: { bg: '#FAEEDA', text: '#854F0B', hex: '#BA7517' },
  금: { bg: '#F1EFE8', text: '#444441', hex: '#888780' },
  수: { bg: '#E6F1FB', text: '#185FA5', hex: '#2563EB' },
};

/** 오행 운 유형 */
export const OHAENG_LUCK: Record<Ohaeng, string[]> = {
  목: ['건강운', '창업운', '학업운', '성장운'],
  화: ['사업운', '승진운', '시험운', '명예운'],
  토: ['부동산운', '안정운', '가정운', '건강운'],
  금: ['금전운', '재물운', '결혼운', '결실운'],
  수: ['금전운', '연애운', '인간관계', '지혜운'],
};

// ─────────────────────────────────────────────
// 천간 / 지지
// ─────────────────────────────────────────────

/** 천간(天干) 10개 */
export type Cheongan =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export const CHEONGAN_LIST: Cheongan[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
];

export const CHEONGAN_KR: Record<Cheongan, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};

/** 지지(地支) 12개 */
export type Jiji =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export const JIJI_LIST: Jiji[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
];

export const JIJI_KR: Record<Jiji, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

// ─────────────────────────────────────────────
// 사주 입/출력 타입
// ─────────────────────────────────────────────

/** 사주 입력값 */
export interface SajuInput {
  /** 출생 연도 (양력, 예: 1990) */
  year: number;
  /** 출생 월 (1~12) */
  month: number;
  /** 출생 일 (1~31) */
  day: number;
  /**
   * 출생 시간 (0~23, 24시 기준)
   * 미입력 시 시주(時柱) 계산 생략
   */
  hour?: number;
  /** 성별 (향후 용신 계산에 활용) */
  gender?: 'male' | 'female';
}

/** 사주 하나의 기둥 (柱) */
export interface Pillar {
  /** 천간 한자 (甲/乙...) */
  cheongan: Cheongan;
  /** 지지 한자 (子/丑...) */
  jiji: Jiji;
  /** 천간 한글 (갑/을...) */
  cheonganKr: string;
  /** 지지 한글 (자/축...) */
  jijiKr: string;
  /** 천간의 오행 */
  cheonganOhaeng: Ohaeng;
  /** 지지의 오행 */
  jijiOhaeng: Ohaeng;
  /** 표시용 문자열 (예: "갑자") */
  label: string;
}

/** 오행별 분포 */
export type OhaengCount = Record<Ohaeng, number>;

/** 사주 분석 결과 */
export interface SajuResult {
  /** 입력값 */
  input: SajuInput;
  /** 사주팔자 4기둥 */
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  /** 오행별 개수 (최대 8개 글자 기준) */
  ohaengCount: OhaengCount;
  /** 오행별 강도 (0~100, 정규화) */
  ohaengStrength: Record<Ohaeng, number>;
  /** 부족 오행 (강도 하위 2개) */
  weakOhaeng: Ohaeng[];
  /** 강한 오행 (강도 상위 2개) */
  strongOhaeng: Ohaeng[];
  /**
   * 오행 불균형 점수 (0~100)
   * 높을수록 특정 오행에 편중, 낮을수록 균형
   */
  imbalanceScore: number;
  /** 사주 요약 텍스트 (UI 표시용) */
  summary: string;
  /** 입춘 기준 주의 필요 여부 */
  inputChunWarning?: boolean;
}

/** 장소 추천 필터 (사주 → 장소 매핑용) */
export interface OhaengFilter {
  /** 보충해야 할 오행 (명당 탐색 기준) */
  targetOhaeng: Ohaeng[];
  /** 추천 운 유형 */
  recommendedLuckTypes: string[];
}
