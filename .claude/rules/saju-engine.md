---
paths:
  - "lib/saju/**"
---

# 사주 엔진 도메인 규칙

## 핵심 원칙

사주 계산 엔진은 **전통 역학 알고리즘의 정확한 구현**이다.
수학적 오류는 서비스 신뢰도에 직결되므로 신중하게 다룬다.

## 엔진 수정 시 필수 절차

```bash
# 1. 35개 단위 테스트 실행 — 모두 통과해야 커밋 가능
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts

# 2. 경계값 케이스 확인 (입춘 전후, 연말, 자시 경계)
# 3. 역사적 검증일 재확인 (2024=갑진, 1990=경오, 1984=갑자)
```

## 알고리즘 요약 (절대 변경 금지 — 전통 역학 기반)

```typescript
// 년주 천간
const cheonganIdx = (year - 4) % 10  // 갑(0)부터 시작

// 년주 지지
const jijiIdx = (year + 8) % 12      // 자(0)부터 시작

// 월주 지지 — 24절기 테이블로 결정 (SOLAR_TERM_DATES)
// 절기 이전 → 이전 달 기준

// 일주 — 앵커: 1900-01-31 = 甲子日 (인덱스 0)
const dayOffset = daysBetween(ANCHOR_DATE, targetDate)
const dayCheonganIdx = dayOffset % 10
const dayJijiIdx = dayOffset % 12

// 시주 — 23시 → 자시(0) 특이 케이스
const hourJijiIdx = hour === 23 ? 0 : Math.floor((hour + 1) / 2)

// 입춘 경계 — 입춘 전이면 effectiveYear = year - 1
```

## 타입 규칙

```typescript
// Ohaeng 타입 항상 사용 (string 금지)
import type { Ohaeng } from './types'
const o: Ohaeng = '목'  // ✅
const o: string = '목'  // ❌

// 천간/지지 상수 참조
import { CHEONGAN_LIST, JIJI_LIST } from './types'
// CHEONGAN_LIST[0] = '갑', JIJI_LIST[0] = '자'
```

## 오행 분석 논리

```typescript
// weakOhaeng: 강도 기준 하위 2개
// strongOhaeng: 강도 기준 상위 2개
// imbalanceScore: 표준편차 기반 (stdDev / 40 * 100)
// ohaengStrength: 정규화된 퍼센트 (합계 ≈ 100)

// 주의: 시주 없을 때 → 6글자 기준 오행 카운팅
//       시주 있을 때 → 8글자 기준
```

## 테스트 케이스 기준값 (불변)

| 연도 | 년천간 | 년지지 | 검증 |
|------|--------|--------|------|
| 2024 | 갑(甲) | 진(辰) | 갑진년 ✅ |
| 2023 | 계(癸) | 묘(卯) | 계묘년 ✅ |
| 1990 | 경(庚) | 오(午) | 경오년 ✅ |
| 1984 | 갑(甲) | 자(子) | 갑자년 ✅ |

## 주석 규칙

```typescript
// ✅ 역학 용어 한국어 주석 필수
/** 五虎遁月法: 년천간 기준으로 인월(寅) 천간 결정 */
const MONTH_CHEONGAN_BASE: Record<number, number> = { 0: 2, 2: 4, ... }

// ✅ 알고리즘 출처 표기
// 출처: 명리학 기본 원리 (자평진전 기준)
```

## 금지 사항

```typescript
// ❌ 엔진 로직 외부에서 직접 계산
const year천간 = (year - 4) % 10  // ← API/Component에서 직접 계산 금지

// ✅ 항상 calculateSaju() 통해 접근
import { calculateSaju } from '@/lib/saju'
const result = calculateSaju({ year, month, day, hour })
```
