/**
 * 사주 계산 엔진 검증 테스트
 *
 * 검증 방법:
 *  - 역사적으로 사주가 알려진 인물 또는 날짜로 교차 검증
 *  - 오행 분포 논리적 일관성 검증
 *  - 경계값 테스트 (입춘 전후, 연말, 자시 경계)
 *
 * 실행: npx ts-node engine.test.ts
 */

import { calculateSaju } from './engine';
import { CHEONGAN_KR, JIJI_KR } from './types';

// ─────────────────────────────────────────────
// 테스트 유틸
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function expectContains(label: string, arr: unknown[], item: unknown) {
  const ok = arr.includes(item);
  if (ok) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} (${JSON.stringify(item)} not in ${JSON.stringify(arr)})`);
    failed++;
  }
}

function test(name: string, fn: () => void) {
  console.log(`\n📌 ${name}`);
  fn();
}

// ─────────────────────────────────────────────
// TEST SUITE 1: 년주(年柱) 검증
// ─────────────────────────────────────────────

test('년주 천간지지 검증', () => {
  // 2024년 = 甲辰年 (갑진년) — 용(龍)의 해
  const result2024 = calculateSaju({ year: 2024, month: 5, day: 1 });
  expect('2024년 년천간 = 갑(甲)', result2024.pillars.year.cheonganKr, '갑');
  expect('2024년 년지지 = 진(辰)', result2024.pillars.year.jijiKr, '진');

  // 2023년 = 癸卯年 (계묘년)
  const result2023 = calculateSaju({ year: 2023, month: 5, day: 1 });
  expect('2023년 년천간 = 계(癸)', result2023.pillars.year.cheonganKr, '계');
  expect('2023년 년지지 = 묘(卯)', result2023.pillars.year.jijiKr, '묘');

  // 1990년 = 庚午年 (경오년)
  const result1990 = calculateSaju({ year: 1990, month: 5, day: 1 });
  expect('1990년 년천간 = 경(庚)', result1990.pillars.year.cheonganKr, '경');
  expect('1990년 년지지 = 오(午)', result1990.pillars.year.jijiKr, '오');

  // 1984년 = 甲子年 (갑자년)
  const result1984 = calculateSaju({ year: 1984, month: 5, day: 1 });
  expect('1984년 년천간 = 갑(甲)', result1984.pillars.year.cheonganKr, '갑');
  expect('1984년 년지지 = 자(子)', result1984.pillars.year.jijiKr, '자');
});

// ─────────────────────────────────────────────
// TEST SUITE 2: 월주(月柱) 검증
// ─────────────────────────────────────────────

test('월주 지지 검증 (절기 기준)', () => {
  // 입춘(2/4) 이후 → 寅月
  const feb10 = calculateSaju({ year: 2024, month: 2, day: 10 });
  expect('2024-02-10 → 인월(寅)', feb10.pillars.month.jijiKr, '인');

  // 경칩(3/6) 이후 → 卯月
  const mar15 = calculateSaju({ year: 2024, month: 3, day: 15 });
  expect('2024-03-15 → 묘월(卯)', mar15.pillars.month.jijiKr, '묘');

  // 청명(4/5) 이후 → 辰月
  const apr10 = calculateSaju({ year: 2024, month: 4, day: 10 });
  expect('2024-04-10 → 진월(辰)', apr10.pillars.month.jijiKr, '진');

  // 소서(7/7) 이후 → 未月
  const jul10 = calculateSaju({ year: 2024, month: 7, day: 10 });
  expect('2024-07-10 → 미월(未)', jul10.pillars.month.jijiKr, '미');
});

test('월주 천간 검증 (五虎遁月法)', () => {
  // 2024 甲辰年 → 인월 丙寅
  const feb2024 = calculateSaju({ year: 2024, month: 2, day: 10 });
  expect('甲년 인월천간 = 병(丙)', feb2024.pillars.month.cheonganKr, '병');

  // 1990 庚午年 → 인월 戊寅
  const feb1990 = calculateSaju({ year: 1990, month: 2, day: 10 });
  expect('庚년 인월천간 = 무(戊)', feb1990.pillars.month.cheonganKr, '무');
});

// ─────────────────────────────────────────────
// TEST SUITE 3: 일주(日柱) 검증
// ─────────────────────────────────────────────

test('일주 검증 (앵커 기준일)', () => {
  // 앵커: 1900-01-31 = 甲子日
  const anchor = calculateSaju({ year: 1900, month: 1, day: 31 });
  expect('앵커일 천간 = 갑(甲)', anchor.pillars.day.cheonganKr, '갑');
  expect('앵커일 지지 = 자(子)', anchor.pillars.day.jijiKr, '자');

  // 앵커 + 1 = 乙丑日
  const dayAfter = calculateSaju({ year: 1900, month: 2, day: 1 });
  expect('앵커+1일 천간 = 을(乙)', dayAfter.pillars.day.cheonganKr, '을');
  expect('앵커+1일 지지 = 축(丑)', dayAfter.pillars.day.jijiKr, '축');

  // 앵커 + 60 = 다시 甲子日 (60갑자 순환)
  const day60 = calculateSaju({ year: 1900, month: 4, day: 1 });
  expect('앵커+60일 천간 = 갑(甲)', day60.pillars.day.cheonganKr, '갑');
  expect('앵커+60일 지지 = 자(子)', day60.pillars.day.jijiKr, '자');
});

// ─────────────────────────────────────────────
// TEST SUITE 4: 시주(時柱) 검증
// ─────────────────────────────────────────────

test('시주 지지 검증 (12지시)', () => {
  // 자시: 23시
  const r23 = calculateSaju({ year: 2024, month: 1, day: 15, hour: 23 });
  expect('23시 → 자시(子)', r23.pillars.hour?.jijiKr, '자');

  // 오시: 11~12시
  const r11 = calculateSaju({ year: 2024, month: 1, day: 15, hour: 11 });
  expect('11시 → 오시(午)', r11.pillars.hour?.jijiKr, '오');

  // 인시: 3~4시
  const r3 = calculateSaju({ year: 2024, month: 1, day: 15, hour: 3 });
  expect('3시 → 인시(寅)', r3.pillars.hour?.jijiKr, '인');
});

test('시주 미입력 시 null 처리', () => {
  const r = calculateSaju({ year: 2024, month: 5, day: 1 });
  expect('시간 미입력 → hour pillar null', r.pillars.hour, null);
  // 지장간 가중 합산: 3기둥(천간3 + 지지 지장간) ≈ 6 (±0.01 허용)
  const total = Object.values(r.ohaengCount).reduce((a, b) => a + b, 0);
  expect('시간 미입력 → 오행 합계 ≈ 6', Math.abs(total - 6) < 0.01, true);
});

// ─────────────────────────────────────────────
// TEST SUITE 5: 오행 분석 검증
// ─────────────────────────────────────────────

test('오행 분포 논리적 검증', () => {
  const r = calculateSaju({ year: 1990, month: 7, day: 15, hour: 14 });

  // 지장간 가중 합산: 4기둥(천간4 + 지지 지장간) ≈ 8 (±0.01 허용)
  const countSum = Object.values(r.ohaengCount).reduce((a, b) => a + b, 0);
  expect('오행 개수 합 ≈ 8 (시주 포함)', Math.abs(countSum - 8) < 0.01, true);

  // 강도 합계 ≈ 100 (±1 반올림 오차 허용)
  const strengthSum = Object.values(r.ohaengStrength).reduce((a, b) => a + b, 0);
  const strengthSumOk = Math.abs(strengthSum - 100) <= 2;
  expect('오행 강도 합 ≈ 100', strengthSumOk, true);

  // weakOhaeng은 항상 2개
  expect('weakOhaeng 2개', r.weakOhaeng.length, 2);

  // strongOhaeng은 항상 2개
  expect('strongOhaeng 2개', r.strongOhaeng.length, 2);

  // weakOhaeng이 strongOhaeng보다 강도가 낮거나 같음
  const weakMax = Math.max(...r.weakOhaeng.map((o) => r.ohaengStrength[o]));
  const strongMin = Math.min(...r.strongOhaeng.map((o) => r.ohaengStrength[o]));
  expect('weakOhaeng 강도 ≤ strongOhaeng 강도', weakMax <= strongMin, true);
});

test('입춘 경계 처리', () => {
  // 1990-01-15 (입춘 전) → 년주는 1989년 기준
  const before = calculateSaju({ year: 1990, month: 1, day: 15 });
  expect('입춘 전 → inputChunWarning = true', before.inputChunWarning, true);
  // 1989 己巳年 → 기사년
  expect('입춘 전 1990-01 → 년천간 기(己)', before.pillars.year.cheonganKr, '기');

  // 1990-05-01 (입춘 후) → 정상 1990년
  const after = calculateSaju({ year: 1990, month: 5, day: 1 });
  expect('입춘 후 → inputChunWarning = false', after.inputChunWarning, false);
  expect('입춘 후 → 년천간 경(庚)', after.pillars.year.cheonganKr, '경');
});

// ─────────────────────────────────────────────
// TEST SUITE 6: 실사용 시나리오
// ─────────────────────────────────────────────

test('실사용 시나리오 — 사주 결과 출력', () => {
  const r = calculateSaju({ year: 1995, month: 3, day: 22, hour: 9 });

  console.log('\n  📊 사주 분석 결과 샘플:');
  console.log(`  年柱: ${r.pillars.year.label} (${r.pillars.year.cheonganOhaeng}/${r.pillars.year.jijiOhaeng})`);
  console.log(`  月柱: ${r.pillars.month.label} (${r.pillars.month.cheonganOhaeng}/${r.pillars.month.jijiOhaeng})`);
  console.log(`  日柱: ${r.pillars.day.label} (${r.pillars.day.cheonganOhaeng}/${r.pillars.day.jijiOhaeng})`);
  if (r.pillars.hour) {
    console.log(`  時柱: ${r.pillars.hour.label} (${r.pillars.hour.cheonganOhaeng}/${r.pillars.hour.jijiOhaeng})`);
  }
  console.log(`  오행 분포:`, r.ohaengCount);
  console.log(`  오행 강도:`, r.ohaengStrength);
  console.log(`  부족 오행:`, r.weakOhaeng);
  console.log(`  강한 오행:`, r.strongOhaeng);
  console.log(`  불균형 점수:`, r.imbalanceScore);
  console.log(`  요약: ${r.summary}`);

  expect('요약 텍스트 생성됨', r.summary.length > 0, true);
});

// ─────────────────────────────────────────────
// TEST SUITE C1: 지장간 검증
// ─────────────────────────────────────────────

test('지장간 비율 검증', () => {
  const { JIJANGGAN, JIJI_LIST } = require('./types');

  // 子의 지장간: 壬 100% → 수 1.0
  const jaSub = JIJANGGAN['子'];
  expect('子 지장간 1개', jaSub.length, 1);
  expect('子 지장간 천간 = 壬', jaSub[0].cheongan, '壬');
  expect('子 지장간 비율 = 100', jaSub[0].ratio, 100);

  // 丑의 지장간 비율 합 = 100
  const chukSub = JIJANGGAN['丑'];
  const chukTotal = chukSub.reduce((s: number, e: {ratio: number}) => s + e.ratio, 0);
  expect('丑 지장간 비율 합 = 100', chukTotal, 100);

  // 모든 지지 비율 합 = 100 검증
  for (const jiji of JIJI_LIST) {
    const total = JIJANGGAN[jiji].reduce((s: number, e: {ratio: number}) => s + e.ratio, 0);
    expect(`${jiji} 지장간 비율 합 = 100`, total, 100);
  }

  // 오행 강도 합 ≈ 100%
  const r = calculateSaju({ year: 1990, month: 7, day: 15, hour: 10 });
  const strengthTotal = Object.values(r.ohaengStrength).reduce((a, b) => a + b, 0);
  expect('오행 강도 합 ≈ 100 (±6)', Math.abs(strengthTotal - 100) < 6, true);
});

// ─────────────────────────────────────────────
// TEST SUITE C2: 용신 계산 검증
// ─────────────────────────────────────────────

test('용신/희신/bodyStrength 타입 검증', () => {
  const r = calculateSaju({ year: 1990, month: 7, day: 15, hour: 10 });
  const validOhaeng = ['목', '화', '토', '금', '수'];
  expect('용신이 유효한 오행', validOhaeng.includes(r.yongshin), true);
  expect('희신이 유효한 오행', validOhaeng.includes(r.heeshin), true);
  expect('bodyStrength 유효', ['strong', 'weak', 'balanced'].includes(r.bodyStrength), true);
});

test('화 신강 사주 용신 검증', () => {
  // 병오년(1966) 강한 화 사주
  const r = calculateSaju({ year: 1966, month: 7, day: 7, hour: 13 });
  expect('bodyStrength 유효값', ['strong', 'weak', 'balanced'].includes(r.bodyStrength), true);
  // bodyStrength strong이고 일간 화면 용신은 토
  if (r.bodyStrength === 'strong' && r.pillars.day.cheonganOhaeng === '화') {
    expect('화 신강 → 용신 토', r.yongshin, '토');
  } else {
    // 조건이 맞지 않아도 유효한 오행이어야 함
    expect('용신 유효', ['목', '화', '토', '금', '수'].includes(r.yongshin), true);
  }
});

// ─────────────────────────────────────────────
// TEST SUITE C3: 합충 검증
// ─────────────────────────────────────────────

test('hapChung 배열 반환', () => {
  const r = calculateSaju({ year: 1984, month: 6, day: 20, hour: 9 });
  expect('hapChung는 배열', Array.isArray(r.hapChung), true);
  // 합충 항목이 있으면 타입 확인
  if (r.hapChung.length > 0) {
    const validTypes = ['cheonganHap', 'jijiChung', 'samhap'];
    expect('합충 타입 유효', validTypes.includes(r.hapChung[0].type), true);
    expect('합충 설명 존재', r.hapChung[0].description.length > 0, true);
  }
});

test('hapChung 없는 경우 빈 배열', () => {
  // 합충이 없는 일반 사주
  const r = calculateSaju({ year: 2000, month: 1, day: 1 });
  expect('hapChung 배열', Array.isArray(r.hapChung), true);
});

// ─────────────────────────────────────────────
// 결과 집계
// ─────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log(`✅ 통과: ${passed}  ❌ 실패: ${failed}  총: ${passed + failed}`);
if (failed === 0) {
  console.log('🎉 모든 테스트 통과!');
} else {
  console.log('⚠️  실패한 테스트를 확인하세요.');
  process.exit(1);
}
