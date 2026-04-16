---
paths:
  - "lib/saju/**"
  - "app/api/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# 테스트 전략 규칙

<!-- 담당 에이전트: QAVerifier Agent — Phase C 집중, 전 Phase 검증 -->

## 테스트 철학

**사주 엔진은 도메인 전문 지식을 코드로 구현한 것**이다.
잘못된 계산은 사용자 신뢰를 즉각 파괴한다.
테스트는 "코드 문법 검증"이 아니라 **"역학 계산 정확도 검증"** 이다.

---

## 사주 엔진 테스트 기준

### 필수 테스트 커버리지

```typescript
// 1. 역사적 기준점 검증 (불변)
// 2024 = 갑진(甲辰), 2023 = 계묘(癸卯), 1990 = 경오(庚午), 1984 = 갑자(甲子)

// 2. 절기 경계값 (가장 중요)
// 입춘 전날 23:59 → 이전 년도 기준
// 입춘 당일 00:01 (입춘 후) → 해당 년도 기준
// 절기 경계일 (월 변환 기준)

// 3. 시주 경계값
// 23:00 → 자시(子時) (다음날 자시)
// 00:00 → 자시(子時)
// 01:00 → 축시(丑時)

// 4. 특수 케이스
// 1900-01-31 앵커 날짜 자체
// 2100년 경계
```

### 테스트 실행 명령

```bash
# 기존 35개 테스트 실행 (엔진 수정 시 필수)
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts

# ts-node용 tsconfig 생성 (없으면)
cat > /tmp/tsconfig_test.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2020", "dom"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true
  }
}
EOF
```

### Phase C 테스트 확장 목표: 100개

```
기존 35개 → 유지
추가 65개:
  - 지장간 계산 검증: 12지지 × 지장간 비율 = 12개
  - 절기 경계 정밀화: 주요 절기 전후 각 2개 = 48개
  - 용신 기초 분석: 신강/신약 대표 사례 각 2개 = 4개 (추후)
  - 합충 탐지: 주요 조합 6개
```

---

## API 테스트 기준

```bash
# 핵심 API 연기 검증 (수동 테스트)
# POST /api/saju — 사주 계산
curl -s localhost:3000/api/saju -X POST \
  -H "Content-Type: application/json" \
  -d '{"year":1990,"month":3,"day":15,"hour":10}' | jq '.data.pillars'
# 기대: 경오년 기둥 데이터

# GET /api/places?ohaeng=화 — 필터링
curl -s "localhost:3000/api/places?ohaeng=화" | jq '.count'
# 기대: > 0

# GET /api/recommend?weak=수 — 추천
curl -s "localhost:3000/api/recommend?weak=수" | jq '.[0].name'
# 기대: 수 기운 장소 이름
```

---

## 품질 게이트 — Phase 완료 조건

### Phase B (UX/UI) 완료 전

```bash
# 1. TypeScript 오류 없음
npm run type-check

# 2. ESLint 오류 없음
npm run lint

# 3. 빌드 성공
npm run build

# 4. 핵심 페이지 응답 확인
curl -s -o /dev/null -w "%{http_code}" localhost:3000             # 200
curl -s -o /dev/null -w "%{http_code}" localhost:3000/onboarding  # 200
curl -s -o /dev/null -w "%{http_code}" "localhost:3000/result?y=1990&m=3&d=15&h=10"  # 200
```

### Phase C (사주 엔진) 완료 전

```bash
# 5. 사주 엔진 전체 테스트 통과 (100개 목표)
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
# 기대: XX passed, 0 failed
```

### Phase D (배포) 완료 전

```bash
# 6. Lighthouse 점수
# Performance: 90+, SEO: 95+, Accessibility: 85+

# 7. 서버 전용 키가 클라이언트 코드에 없음을 확인
# R5 규칙 준수: 서비스 롤 키는 절대 클라이언트 노출 금지
grep -r "service_role" app/ components/ lib/ --include="*.ts" --include="*.tsx"
# 기대: 0건
```

---

## 테스트 데이터 관리

```typescript
// ✅ Mock 데이터는 lib/mock-data.ts 단일 파일
// ✅ 테스트 케이스는 lib/saju/engine.test.ts 단일 파일
// ❌ 테스트 전용 DB 연결 금지 (Mock 데이터만 사용)
// ❌ 실제 Supabase를 테스트에서 직접 호출 금지 (isMockMode() 사용)
```

---

## 사주 계산 허용 오차

```
년주 계산: 오차 0% (결정론적 계산)
월주 계산: 오차 0% (절기 테이블 정확도 개선 후)
일주 계산: 오차 0% (1900-01-31 앵커 기준 오프셋)
시주 계산: 오차 0% (23시 자시 경계 포함)
오행 강도: 오차 ±2% 허용 (지장간 비율 반영 시)
용신 분석: 전문가 검증 대비 정확도 80%+ 목표
```
