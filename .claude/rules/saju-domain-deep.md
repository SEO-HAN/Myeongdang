---
paths:
  - "lib/saju/**"
  - "app/api/saju/**"
  - "app/api/recommend/**"
  - "app/result/**"
---

# 사주 도메인 심화 규칙

<!-- 담당 에이전트: SajuExpert Agent — Phase C 전반 -->

## 전통 역학 기준

명당지도 사주 엔진은 **자평진전(子平眞詮) + 명리정종(命理正宗)** 기준을 따른다.
한국 주요 만세력 서비스(사주팔자, 운세앱) 계산 결과와 오차 ≤ ±1일 이내를 목표로 한다.

---

## 지장간(地藏干) 구현 기준

각 지지(地支) 내에는 숨겨진 천간(天干)이 있으며, 오행 강도 계산에 포함해야 한다.

```typescript
// 12지지별 지장간 비율 (여기장간 기준)
export const JIJANGGAN: Record<string, Array<{ cheongan: string; ratio: number }>> = {
  '자': [{ cheongan: '임', ratio: 100 }],
  '축': [{ cheongan: '계', ratio: 30 }, { cheongan: '기', ratio: 60 }, { cheongan: '신', ratio: 10 }],
  '인': [{ cheongan: '무', ratio: 7 }, { cheongan: '병', ratio: 7 }, { cheongan: '갑', ratio: 86 }],
  '묘': [{ cheongan: '갑', ratio: 10 }, { cheongan: '을', ratio: 90 }],
  '진': [{ cheongan: '을', ratio: 9 }, { cheongan: '계', ratio: 3 }, { cheongan: '무', ratio: 88 }],
  '사': [{ cheongan: '무', ratio: 7 }, { cheongan: '경', ratio: 7 }, { cheongan: '병', ratio: 86 }],
  '오': [{ cheongan: '병', ratio: 10 }, { cheongan: '기', ratio: 10 }, { cheongan: '정', ratio: 80 }],
  '미': [{ cheongan: '정', ratio: 9 }, { cheongan: '을', ratio: 3 }, { cheongan: '기', ratio: 88 }],
  '신': [{ cheongan: '무', ratio: 7 }, { cheongan: '임', ratio: 7 }, { cheongan: '경', ratio: 86 }],
  '유': [{ cheongan: '경', ratio: 10 }, { cheongan: '신', ratio: 90 }],
  '술': [{ cheongan: '신', ratio: 9 }, { cheongan: '정', ratio: 3 }, { cheongan: '무', ratio: 88 }],
  '해': [{ cheongan: '무', ratio: 7 }, { cheongan: '갑', ratio: 7 }, { cheongan: '임', ratio: 86 }],
}
```

---

## 용신(用神) / 희신(喜神) 기초 분석 — 억부법(抑扶法)

```typescript
// 일간(日干)의 강약을 분석하여 부족한 오행을 용신으로 지정
// 신강(身强): 일간 오행이 강함 → 설기(洩氣)·극(剋)하는 오행을 용신
// 신약(身弱): 일간 오행이 약함 → 생(生)·같은 오행을 용신

// 강도 기준 — 일간 + 같은 오행 count > 4 → 신강
// 용신 우선순위:
//   신강 → 식신·상관(오행 설기) > 재성(오행 극) > 관성
//   신약 → 인성(오행 생) > 비겁(같은 오행) > 식신
```

---

## 합충(合沖) 분석

```typescript
// 천간합(天干合) — 두 천간이 합쳐 다른 오행으로 변화
export const CHEONGAN_HAP: Record<string, { partner: string; result: string }> = {
  '갑': { partner: '기', result: '토' },
  '을': { partner: '경', result: '금' },
  '병': { partner: '신', result: '수' },
  '정': { partner: '임', result: '목' },
  '무': { partner: '계', result: '화' },
}

// 지지충(地支沖) — 6충: 자오충, 축미충, 인신충, 묘유충, 진술충, 사해충
export const JIJI_CHUNG: Record<string, string> = {
  '자': '오', '오': '자',
  '축': '미', '미': '축',
  '인': '신', '신': '인',
  '묘': '유', '유': '묘',
  '진': '술', '술': '진',
  '사': '해', '해': '사',
}

// 삼합(三合) — 국(局) 형성으로 오행 강화
export const SAMHAP: Record<string, { members: string[]; result: string }> = {
  '수국': { members: ['신', '자', '진'], result: '수' },
  '목국': { members: ['해', '묘', '미'], result: '목' },
  '화국': { members: ['인', '오', '술'], result: '화' },
  '금국': { members: ['사', '유', '축'], result: '금' },
}
```

---

## 절기(節氣) 정밀화 기준

```typescript
// 현재: SOLAR_TERM_DATES 고정 테이블 (±1일 오차 허용)
// 목표: korean-lunar-calendar 패키지로 실제 절기 시각 계산

// 절기 경계 처리 원칙:
// 1. 입춘 당일 — 입춘 시각(時刻) 이전이면 전년도 기준
// 2. 절기 당일 — 해당 절기 시각 이전이면 이전 달 기준
// 3. 1950~2100 범위 내 정확도 보장

// 경계값 테스트 케이스 (필수)
// - 입춘 당일 정각: 2024-02-04 → 갑진년
// - 입춘 1시간 전: 2024-02-03 23:xx → 계묘년
// - 동지 경계, 하지 경계 등 주요 절기 전후
```

---

## 풍수 명당 연결 로직

```typescript
// 약한 오행 → 보완하는 장소 추천
// 예) 수(水) 약함 → 수(水) 기운 강한 명당 우선 노출
// 강한 오행 → 해당 오행 기운 장소도 함께 노출 (공명 원리)

// 개운(開運) 점수 계산:
// base = place.trust_score (0~100)
// bonus = 사주 약한 오행과 place.ohaeng 일치 수 × 10
// ilshinBonus = 오늘 일진 오행과 place 오행 일치 시 +15
// finalScore = Math.min(base + bonus + ilshinBonus, 100)
```

---

## 사주 도메인 금지사항

```
❌ 음력/양력 변환 없이 직접 계산 (한국 전통 명리는 양력 기준)
❌ 시주 없을 때 임의 값 대입 (null/undefined 명시)
❌ 오행 5개 이외의 값 허용 (타입: Ohaeng = '목'|'화'|'토'|'금'|'수')
❌ 지장간 포함 없이 오행 강도 100% 완료 주장
❌ 용신 결과를 확정적 표현 사용 ("반드시" → "이런 기운이 도움됩니다")
❌ 사주 결과를 의학적·법적 조언으로 제시
```

---

## 서비스 문구 기준

```
사주 결과 표현 — 부드럽고 긍정적인 톤
✅ "목 기운을 통해 성장 에너지를 받으실 수 있어요"
✅ "오늘은 금 기운이 강한 날, 결단력이 필요한 일에 좋습니다"
❌ "당신은 반드시 ~ 해야 합니다"
❌ 불길한 직접 표현 없음 (오행 약함 → "보완이 필요한")
```
