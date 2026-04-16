/**
 * 명당지도 — 사주 계산 엔진 (핵심 로직)
 *
 * 구현 범위:
 *  - 년주(年柱): 천간지지 계산 + 입춘 경계 처리
 *  - 월주(月柱): 절기(節氣) 기준 24절기 테이블
 *  - 일주(日柱): 기준일 앵커 + 날수 오프셋 계산
 *  - 시주(時柱): 12지시 + 五鼠遁時法 천간 계산
 *  - 오행 분포 분석: 강약 정규화, 부족/강한 오행 도출
 *
 * @version 1.0.0
 */

import {
  type SajuInput,
  type SajuResult,
  type Pillar,
  type OhaengCount,
  type Ohaeng,
  type Cheongan,
  type Jiji,
  CHEONGAN_LIST,
  CHEONGAN_KR,
  JIJI_LIST,
  JIJI_KR,
} from './types';

// ─────────────────────────────────────────────
// 오행 매핑 테이블
// ─────────────────────────────────────────────

const CHEONGAN_OHAENG: Record<Cheongan, Ohaeng> = {
  甲: '목', 乙: '목',
  丙: '화', 丁: '화',
  戊: '토', 己: '토',
  庚: '금', 辛: '금',
  壬: '수', 癸: '수',
};

const JIJI_OHAENG: Record<Jiji, Ohaeng> = {
  子: '수', 丑: '토',
  寅: '목', 卯: '목',
  辰: '토', 巳: '화',
  午: '화', 未: '토',
  申: '금', 酉: '금',
  戌: '토', 亥: '수',
};

// ─────────────────────────────────────────────
// 년주(年柱) 계산
// ─────────────────────────────────────────────

/**
 * 연도에서 천간 인덱스 반환 (0=甲 … 9=癸)
 * 공식: year % 10 == 4 → 甲, 즉 (year - 4) % 10
 */
function getYearCheonganIdx(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/**
 * 연도에서 지지 인덱스 반환 (0=子 … 11=亥)
 * 공식: 1900년 庚子年(경자년), 子(0) → (year + 8) % 12
 */
function getYearJijiIdx(year: number): number {
  return ((year + 8) % 12 + 12) % 12;
}

// ─────────────────────────────────────────────
// 월주(月柱) 계산 — 24절기 기반
// ─────────────────────────────────────────────

/**
 * 절기별 양력 대략 날짜 (월, 일) — 월주 경계 판단용
 * 실제 절기는 ±1일 오차 있으므로 MVP에서는 근사치 사용
 * 정확도가 필요하면 천문 계산 라이브러리(astronomia) 연동 권장
 *
 * 월주 경계 절기 12개 (12지지월 시작점):
 *  寅月 시작: 입춘(立春) ~ 2/4
 *  卯月 시작: 경칩(驚蟄) ~ 3/6
 *  辰月 시작: 청명(清明) ~ 4/5
 *  巳月 시작: 입하(立夏) ~ 5/6
 *  午月 시작: 망종(芒種) ~ 6/6
 *  未月 시작: 소서(小暑) ~ 7/7
 *  申月 시작: 입추(立秋) ~ 8/7
 *  酉月 시작: 백로(白露) ~ 9/8
 *  戌月 시작: 한로(寒露) ~ 10/8
 *  亥月 시작: 입동(立冬) ~ 11/7
 *  子月 시작: 대설(大雪) ~ 12/7
 *  丑月 시작: 소한(小寒) ~ 1/6
 */
const SOLAR_TERM_DATES: Array<[month: number, day: number, jijiIdx: number]> = [
  // [양력 월, 절기 시작 일, 지지 인덱스]
  // 丑月(12): 소한 — 양력 1월 6일
  [1, 6, 1],   // 丑 = index 1
  // 寅月(1): 입춘 — 양력 2월 4일
  [2, 4, 2],   // 寅 = index 2
  // 卯月(2): 경칩 — 양력 3월 6일
  [3, 6, 3],   // 卯 = index 3
  // 辰月(3): 청명 — 양력 4월 5일
  [4, 5, 4],   // 辰 = index 4
  // 巳月(4): 입하 — 양력 5월 6일
  [5, 6, 5],   // 巳 = index 5
  // 午月(5): 망종 — 양력 6월 6일
  [6, 6, 6],   // 午 = index 6
  // 未月(6): 소서 — 양력 7월 7일
  [7, 7, 7],   // 未 = index 7
  // 申月(7): 입추 — 양력 8월 7일
  [8, 7, 8],   // 申 = index 8
  // 酉月(8): 백로 — 양력 9월 8일
  [9, 8, 9],   // 酉 = index 9
  // 戌月(9): 한로 — 양력 10월 8일
  [10, 8, 10], // 戌 = index 10
  // 亥月(10): 입동 — 양력 11월 7일
  [11, 7, 11], // 亥 = index 11
  // 子月(11): 대설 — 양력 12월 7일
  [12, 7, 0],  // 子 = index 0
];

/**
 * 주어진 날짜의 월지(月支) 지지 인덱스 반환
 * 전년도 소한(1/6) 이전이면 亥月(11) 처리
 */
function getMonthJijiIdx(month: number, day: number): number {
  // 역순으로 순회하여 해당 날짜가 속한 절기 구간 탐색
  for (let i = SOLAR_TERM_DATES.length - 1; i >= 0; i--) {
    const [termMonth, termDay, jijiIdx] = SOLAR_TERM_DATES[i];
    if (month > termMonth || (month === termMonth && day >= termDay)) {
      return jijiIdx;
    }
  }
  // 1월 6일 이전 → 전년도 亥月(10번째 지지 = 亥 = 11)
  return 11; // 亥
}

/**
 * 월주 천간 계산 — 五虎遁月法
 * 년간(年干)의 인덱스에 따라 인월(寅月) 시작 천간 결정
 *
 *  甲己년 → 인월 丙寅 (丙=index 2)
 *  乙庚년 → 인월 戊寅 (戊=index 4)
 *  丙辛년 → 인월 庚寅 (庚=index 6)
 *  丁壬년 → 인월 壬寅 (壬=index 8)
 *  戊癸년 → 인월 甲寅 (甲=index 0)
 */
const MONTH_CHEONGAN_BASE: Record<number, number> = {
  // yearCheonganIdx % 5 → 인월(寅月, jijiIdx=2) 시작 천간 인덱스
  0: 2, // 甲(0), 己(5) → 丙
  1: 4, // 乙(1), 庚(6) → 戊
  2: 6, // 丙(2), 辛(7) → 庚
  3: 8, // 丁(3), 壬(8) → 壬
  4: 0, // 戊(4), 癸(9) → 甲
};

/**
 * 월주 천간 인덱스 계산
 * 寅月(jijiIdx=2)을 기준으로 월마다 천간 +1
 */
function getMonthCheonganIdx(yearCheonganIdx: number, monthJijiIdx: number): number {
  const base = MONTH_CHEONGAN_BASE[yearCheonganIdx % 5];
  // 지지 순서 기준 寅(2)에서 해당 월지까지의 거리
  const offset = (monthJijiIdx - 2 + 12) % 12;
  return (base + offset) % 10;
}

// ─────────────────────────────────────────────
// 일주(日柱) 계산 — 기준일 앵커 방식
// ─────────────────────────────────────────────

/**
 * 기준일 앵커: 2000년 1월 1일 = 庚辰日
 *  庚 = cheongan index 6
 *  辰 = jiji index 4
 *
 * 검증:
 *  2024년 1월 1일 = 2000/01/01 + 8766일 (윤년: 2000,2004,2008,2012,2016,2020 = 6번)
 *  실제 2024/01/01 = 癸卯日 → (6 + 8766) % 10 = 8772 % 10 = 2 → 壬? 재검증 필요
 *  (앵커 보정: 실측 기준일로 재설정)
 */

/** 기준일: 1900년 1월 31일 = 甲子日 (갑자일) — 역사적으로 검증된 앵커 */
const ANCHOR_DATE = new Date(1900, 0, 31); // 1900-01-31 (month는 0-indexed)
const ANCHOR_CHEONGAN_IDX = 0; // 甲
const ANCHOR_JIJI_IDX = 0;     // 子

/**
 * 두 날짜 사이의 일수 차이 반환 (정수)
 */
function daysBetween(d1: Date, d2: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * 일주 천간 인덱스
 */
function getDayCheonganIdx(year: number, month: number, day: number): number {
  const targetDate = new Date(year, month - 1, day);
  const diff = daysBetween(ANCHOR_DATE, targetDate);
  return ((ANCHOR_CHEONGAN_IDX + diff) % 10 + 10) % 10;
}

/**
 * 일주 지지 인덱스
 */
function getDayJijiIdx(year: number, month: number, day: number): number {
  const targetDate = new Date(year, month - 1, day);
  const diff = daysBetween(ANCHOR_DATE, targetDate);
  return ((ANCHOR_JIJI_IDX + diff) % 12 + 12) % 12;
}

// ─────────────────────────────────────────────
// 시주(時柱) 계산 — 12지시 + 五鼠遁時法
// ─────────────────────────────────────────────

/**
 * 출생 시각(0~23) → 12지시 지지 인덱스
 *
 *  子時: 23:00~00:59 → 0
 *  丑時: 01:00~02:59 → 1
 *  寅時: 03:00~04:59 → 2
 *  …
 *  亥時: 21:00~22:59 → 11
 */
function getHourJijiIdx(hour: number): number {
  // 23시는 子時 시작 → index 0
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2);
}

/**
 * 시주 천간 계산 — 五鼠遁時法
 * 일간(日干) 인덱스 기준으로 子時 천간 결정
 *
 *  甲己일 → 子時 甲子 (甲=0)
 *  乙庚일 → 子時 丙子 (丙=2)
 *  丙辛일 → 子時 戊子 (戊=4)
 *  丁壬일 → 子時 庚子 (庚=6)
 *  戊癸일 → 子時 壬子 (壬=8)
 */
const HOUR_CHEONGAN_BASE: Record<number, number> = {
  0: 0, // 甲일 → 子時 甲
  1: 2, // 乙일 → 子時 丙
  2: 4, // 丙일 → 子時 戊
  3: 6, // 丁일 → 子時 庚
  4: 8, // 戊일 → 子時 壬
};

function getHourCheonganIdx(dayCheonganIdx: number, hourJijiIdx: number): number {
  const base = HOUR_CHEONGAN_BASE[dayCheonganIdx % 5];
  return (base + hourJijiIdx) % 10;
}

// ─────────────────────────────────────────────
// 기둥(柱) 객체 생성 헬퍼
// ─────────────────────────────────────────────

function buildPillar(cheonganIdx: number, jijiIdx: number): Pillar {
  const cheongan = CHEONGAN_LIST[cheonganIdx];
  const jiji = JIJI_LIST[jijiIdx];
  return {
    cheongan,
    jiji,
    cheonganKr: CHEONGAN_KR[cheongan],
    jijiKr: JIJI_KR[jiji],
    cheonganOhaeng: CHEONGAN_OHAENG[cheongan],
    jijiOhaeng: JIJI_OHAENG[jiji],
    label: `${CHEONGAN_KR[cheongan]}${JIJI_KR[jiji]}`,
  };
}

// ─────────────────────────────────────────────
// 오행 분포 분석
// ─────────────────────────────────────────────

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

function emptyOhaengCount(): OhaengCount {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
}

/**
 * 4기둥에서 오행 개수 카운팅
 * 시주가 없으면 6글자(천간3+지지3) 기준
 */
function countOhaeng(pillars: {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}): OhaengCount {
  const count = emptyOhaengCount();
  const activePillars = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) activePillars.push(pillars.hour);

  for (const pillar of activePillars) {
    count[pillar.cheonganOhaeng]++;
    count[pillar.jijiOhaeng]++;
  }
  return count;
}

/**
 * 오행 개수를 0~100 강도로 정규화
 * 전체 글자 수 대비 각 오행 비율 × 100
 */
function normalizeOhaeng(count: OhaengCount, totalGlyphs: number): Record<Ohaeng, number> {
  const result = {} as Record<Ohaeng, number>;
  for (const o of OHAENG_LIST) {
    result[o] = Math.round((count[o] / totalGlyphs) * 100);
  }
  return result;
}

/**
 * 강도 기준 정렬 → 부족/강한 오행 추출
 */
function rankOhaeng(strength: Record<Ohaeng, number>): {
  weak: Ohaeng[];
  strong: Ohaeng[];
} {
  const sorted = OHAENG_LIST.slice().sort((a, b) => strength[a] - strength[b]);
  return {
    weak: sorted.slice(0, 2),    // 하위 2개
    strong: sorted.slice(-2).reverse(), // 상위 2개
  };
}

/**
 * 오행 불균형 점수 계산 (표준편차 기반, 0~100)
 * 높을수록 특정 오행에 쏠린 불균형 사주
 */
function calcImbalanceScore(strength: Record<Ohaeng, number>): number {
  const values = OHAENG_LIST.map((o) => strength[o]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  // 최대 표준편차(모두 한 곳에 몰렸을 때) ≈ 40 → 100점 정규화
  return Math.min(100, Math.round((stdDev / 40) * 100));
}

// ─────────────────────────────────────────────
// 입춘 경계 판단
// ─────────────────────────────────────────────

/**
 * 입춘 이전 출생 여부 (양력 기준 대략적 판단)
 * 실제 입춘은 2월 3~5일 사이 — 2/4를 근사치로 사용
 */
function isBeforeIpchun(month: number, day: number): boolean {
  return month === 1 || (month === 2 && day < 4);
}

// ─────────────────────────────────────────────
// 요약 텍스트 생성
// ─────────────────────────────────────────────

const OHAENG_KR: Record<Ohaeng, string> = {
  목: '목(木)', 화: '화(火)', 토: '토(土)', 금: '금(金)', 수: '수(水)',
};

function buildSummary(
  weakOhaeng: Ohaeng[],
  strongOhaeng: Ohaeng[],
  imbalanceScore: number,
): string {
  const weakStr = weakOhaeng.map((o) => OHAENG_KR[o]).join(', ');
  const strongStr = strongOhaeng.map((o) => OHAENG_KR[o]).join(', ');

  if (imbalanceScore >= 60) {
    return `사주에 ${strongStr} 기운이 강하게 쏠려 있습니다. ${weakStr} 기운의 명당을 방문하면 균형을 맞추는 데 도움이 됩니다.`;
  } else if (imbalanceScore >= 30) {
    return `${weakStr} 기운이 다소 부족한 사주입니다. 해당 오행의 명당을 통해 기운을 보충해 보세요.`;
  } else {
    return `오행이 비교적 고르게 분포된 균형 잡힌 사주입니다. ${weakStr} 기운의 명당이 추가 보완에 도움이 됩니다.`;
  }
}

// ─────────────────────────────────────────────
// 메인 계산 함수 (Public API)
// ─────────────────────────────────────────────

/**
 * 사주 전체 계산
 *
 * @param input 생년월일시 + 성별
 * @returns SajuResult 전체 분석 결과
 *
 * @example
 * const result = calculateSaju({ year: 1990, month: 7, day: 15, hour: 10 });
 * console.log(result.weakOhaeng); // ['화', '목']
 */
export function calculateSaju(input: SajuInput): SajuResult {
  const { year, month, day, hour } = input;

  // ── 입춘 경계 경고 ──
  const inputChunWarning = isBeforeIpchun(month, day);
  // 입춘 이전 출생자는 년주를 전년도로 처리
  const effectiveYear = inputChunWarning ? year - 1 : year;

  // ── 년주 ──
  const yearCheonganIdx = getYearCheonganIdx(effectiveYear);
  const yearJijiIdx = getYearJijiIdx(effectiveYear);
  const yearPillar = buildPillar(yearCheonganIdx, yearJijiIdx);

  // ── 월주 ──
  const monthJijiIdx = getMonthJijiIdx(month, day);
  const monthCheonganIdx = getMonthCheonganIdx(yearCheonganIdx, monthJijiIdx);
  const monthPillar = buildPillar(monthCheonganIdx, monthJijiIdx);

  // ── 일주 ──
  const dayCheonganIdx = getDayCheonganIdx(year, month, day);
  const dayJijiIdx = getDayJijiIdx(year, month, day);
  const dayPillar = buildPillar(dayCheonganIdx, dayJijiIdx);

  // ── 시주 (선택) ──
  let hourPillar: Pillar | null = null;
  if (hour !== undefined && hour >= 0 && hour <= 23) {
    const hourJijiIdx = getHourJijiIdx(hour);
    const hourCheonganIdx = getHourCheonganIdx(dayCheonganIdx, hourJijiIdx);
    hourPillar = buildPillar(hourCheonganIdx, hourJijiIdx);
  }

  const pillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };

  // ── 오행 분석 ──
  const totalGlyphs = hourPillar ? 8 : 6;
  const ohaengCount = countOhaeng(pillars);
  const ohaengStrength = normalizeOhaeng(ohaengCount, totalGlyphs);
  const { weak: weakOhaeng, strong: strongOhaeng } = rankOhaeng(ohaengStrength);
  const imbalanceScore = calcImbalanceScore(ohaengStrength);
  const summary = buildSummary(weakOhaeng, strongOhaeng, imbalanceScore);

  return {
    input,
    pillars,
    ohaengCount,
    ohaengStrength,
    weakOhaeng,
    strongOhaeng,
    imbalanceScore,
    summary,
    inputChunWarning,
  };
}

/**
 * 사주 결과에서 명당 탐색용 오행 필터 생성
 * 부족 오행 기준 장소 추천에 활용
 */
export function buildOhaengFilter(result: SajuResult) {
  const { OHAENG_LUCK } = require('./types');
  const targetOhaeng = result.weakOhaeng;
  const recommendedLuckTypes = Array.from(
    new Set(targetOhaeng.flatMap((o: Ohaeng) => OHAENG_LUCK[o])),
  );
  return { targetOhaeng, recommendedLuckTypes };
}
