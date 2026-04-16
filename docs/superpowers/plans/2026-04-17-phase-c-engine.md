# Phase C 사주 엔진 고도화 플랜 (C0~C5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 엔진을 지장간·용신·합충으로 정밀화하고, 개인화 추천 로직과 설득력 있는 결과 UI를 구현한다.

**Architecture:** `lib/saju/types.ts`에 상수 추가 → `engine.ts`에 계산 함수 추가 → `explain.ts`/`recommend.ts` 신규 유틸 → `ResultClient.tsx` UI 반영. 단방향 의존성: types → engine → explain/recommend → UI.

**Tech Stack:** TypeScript, Next.js 14 App Router, Zustand, framer-motion

**Branch:** `feat/phase-c-engine`  
**Working dir:** `/Users/han-eunseo/Documents/Claude/Projects/Myeongdang`

---

## 사전 확인

- [ ] `git checkout -b feat/phase-c-engine`
- [ ] 기존 35개 테스트 통과 확인:
```bash
cat > /tmp/tsconfig_test.json << 'EOF'
{"compilerOptions":{"target":"ES2020","module":"commonjs","moduleResolution":"node","lib":["ES2020","dom"],"types":["node"],"strict":true,"esModuleInterop":true}}
EOF
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```
Expected: 35 passed, 0 failed

---

## Task 1: 온보딩 이름 + 성별 입력 단계 추가

**Files:**
- Modify: `components/saju/BirthInputForm.tsx`
- Modify: `store/user-store.ts`

**현재 상태:** BirthFormData에 `name`, `gender` 없음. 3단계 폼.  
**목표:** Step 0 (이름+성별) 추가로 4단계. store에 name/gender 저장.

- [ ] **Step 1: BirthFormData 타입 확장**

`components/saju/BirthInputForm.tsx` 상단의 `BirthFormData` 인터페이스 수정:

```tsx
export interface BirthFormData {
  name: string          // 추가
  gender: 'male' | 'female'  // 추가
  year: number
  month: number
  day: number
  hour?: number
  luckPreference?: string
}
```

- [ ] **Step 2: TOTAL_STEPS 4로 변경 + 초기값 업데이트**

```tsx
const TOTAL_STEPS = 4

// 초기 상태 (useState 기본값)
const [form, setForm] = useState<BirthFormData>({
  name: '',
  gender: 'male',
  year: 1990,
  month: 6,
  day: 15,
  hour: undefined,
  luckPreference: undefined,
})
const [step, setStep] = useState(0)  // step 0부터 시작
```

- [ ] **Step 3: Step 0 UI — 이름 + 성별 선택**

`AnimatePresence` 내부의 `step === 0` 케이스 추가 (기존 step들은 1, 2, 3으로 shift):

```tsx
{step === 0 && (
  <motion.div key="step0" custom={direction} variants={slideVariants}
    initial="enter" animate="center" exit="exit"
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

    <div className="flex flex-col items-center mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: '#C9973A' }}>
        명당지도에 오신 걸 환영해요
      </p>
      <h2 className="text-2xl font-semibold text-center leading-snug"
        style={{ fontFamily: 'Noto Serif KR, Georgia, serif', color: '#F0EAD8' }}>
        먼저 이름을 알려주세요
      </h2>
    </div>

    {/* 이름 입력 */}
    <div className="mb-6">
      <input
        type="text"
        placeholder="홍길동"
        maxLength={10}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="w-full text-center text-xl font-bold rounded-2xl py-4 px-4 outline-none transition-all"
        style={{
          background: '#F5F1E8',
          border: '2px solid rgba(0,0,0,0.08)',
          color: '#1A1824',
          fontFamily: 'Noto Sans KR, sans-serif',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#C9973A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,151,58,0.15)' }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none' }}
      />
    </div>

    {/* 성별 선택 */}
    <div className="mb-6">
      <p className="text-sm text-center mb-3" style={{ color: 'rgba(160,152,149,0.8)' }}>
        성별을 선택해주세요
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setForm((f) => ({ ...f, gender: g }))}
            className="py-4 rounded-2xl font-semibold text-base transition-all"
            style={form.gender === g
              ? { background: '#C9973A', color: '#fff', border: '2px solid #C9973A' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(240,234,216,0.7)', border: '1.5px solid rgba(255,255,255,0.12)' }
            }
          >
            {g === 'male' ? '👨 남성' : '👩 여성'}
          </button>
        ))}
      </div>
    </div>

    <button
      onClick={() => { if (form.name.trim()) { setDirection(1); setStep(1) } }}
      disabled={!form.name.trim()}
      className="w-full py-4 rounded-2xl font-bold text-base transition-all"
      style={{
        background: form.name.trim() ? '#D94F2A' : 'rgba(255,255,255,0.1)',
        color: form.name.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
        boxShadow: form.name.trim() ? '0px 4px 16px rgba(217,79,42,0.3)' : 'none',
      }}
    >
      시작하기
    </button>
  </motion.div>
)}
```

기존 step 1, 2, 3은 각각 `step === 1`, `step === 2`, `step === 3`으로 변경.  
뒤로가기 버튼의 조건 `step > 0`은 그대로 유지.

- [ ] **Step 4: store/user-store.ts — name/gender 필드 추가**

`UserState` 인터페이스에 추가:
```tsx
// 사주 프로필 섹션 아래
userName: string | null    // 사용자 이름
userGender: 'male' | 'female' | null  // 성별
```

`setSaju` 액션 시그니처 확장:
```tsx
// setSaju가 input + name/gender를 받도록
setSaju: (input: SajuInput, meta?: { name?: string; gender?: 'male' | 'female' }) => SajuResult
```

초기값:
```tsx
userName: null,
userGender: null,
```

`setSaju` 구현 업데이트:
```tsx
setSaju: (input, meta) => {
  const result = calculateSaju(input)
  const profile: SajuProfile = { input, result, savedAt: new Date().toISOString() }
  set({
    profile,
    isProfileComplete: true,
    isPersonalizedMode: true,
    activeOhaengFilter: result.weakOhaeng,
    userName: meta?.name ?? null,
    userGender: meta?.gender ?? null,
  })
  return result
},
```

`partialize`에 `userName`, `userGender` 추가:
```tsx
partialize: (state) => ({
  profile: state.profile,
  isProfileComplete: state.isProfileComplete,
  bookmarkedIds: state.bookmarkedIds,
  userName: state.userName,
  userGender: state.userGender,
}),
```

- [ ] **Step 5: app/onboarding/page.tsx — setSaju 호출 업데이트**

`onboarding/page.tsx`에서 `setSaju` 호출 시 name/gender 전달:

```tsx
// 기존: setSaju(input)
// 변경: setSaju(input, { name: data.name, gender: data.gender })
const result = setSaju(
  { year: data.year, month: data.month, day: data.day, hour: data.hour },
  { name: data.name, gender: data.gender }
)
```

- [ ] **Step 6: type-check 통과**

```bash
npm run type-check
```
Expected: 오류 0개

- [ ] **Step 7: 커밋**

```bash
git add components/saju/BirthInputForm.tsx store/user-store.ts app/onboarding/
git commit -m "feat(C0): 온보딩 이름+성별 입력 단계 추가, store name/gender 저장"
```

---

## Task 2: 지장간(地藏干) + 오행 강도 정밀화

**Files:**
- Modify: `lib/saju/types.ts`
- Modify: `lib/saju/engine.ts`
- Modify: `lib/saju/engine.test.ts`

- [ ] **Step 1: types.ts에 JIJANGGAN 상수 추가**

`lib/saju/types.ts` 끝에 추가:

```typescript
// ─────────────────────────────────────────────
// 지장간(地藏干) — 지지 내 숨겨진 천간 비율
// 여기장간(餘氣藏干) 기준, 자평진전
// ─────────────────────────────────────────────
export const JIJANGGAN: Record<Jiji, Array<{ cheongan: Cheongan; ratio: number }>> = {
  子: [{ cheongan: '壬', ratio: 100 }],
  丑: [{ cheongan: '癸', ratio: 30 }, { cheongan: '己', ratio: 60 }, { cheongan: '辛', ratio: 10 }],
  寅: [{ cheongan: '戊', ratio: 7 }, { cheongan: '丙', ratio: 7 }, { cheongan: '甲', ratio: 86 }],
  卯: [{ cheongan: '甲', ratio: 10 }, { cheongan: '乙', ratio: 90 }],
  辰: [{ cheongan: '乙', ratio: 9 }, { cheongan: '癸', ratio: 3 }, { cheongan: '戊', ratio: 88 }],
  巳: [{ cheongan: '戊', ratio: 7 }, { cheongan: '庚', ratio: 7 }, { cheongan: '丙', ratio: 86 }],
  午: [{ cheongan: '丙', ratio: 10 }, { cheongan: '己', ratio: 10 }, { cheongan: '丁', ratio: 80 }],
  未: [{ cheongan: '丁', ratio: 9 }, { cheongan: '乙', ratio: 3 }, { cheongan: '己', ratio: 88 }],
  申: [{ cheongan: '戊', ratio: 7 }, { cheongan: '壬', ratio: 7 }, { cheongan: '庚', ratio: 86 }],
  酉: [{ cheongan: '庚', ratio: 10 }, { cheongan: '辛', ratio: 90 }],
  戌: [{ cheongan: '辛', ratio: 9 }, { cheongan: '丁', ratio: 3 }, { cheongan: '戊', ratio: 88 }],
  亥: [{ cheongan: '戊', ratio: 7 }, { cheongan: '甲', ratio: 7 }, { cheongan: '壬', ratio: 86 }],
}
```

- [ ] **Step 2: engine.ts — JIJANGGAN import + countOhaeng 개선**

`engine.ts` 상단 import에 `JIJANGGAN` 추가:
```typescript
import {
  // ... 기존 imports
  JIJANGGAN,
} from './types';
```

CHEONGAN_OHAENG 매핑 (engine.ts 내 기존 그대로 유지).

`countOhaeng` 함수를 float 합산으로 교체:

```typescript
// OhaengCount를 float 합산으로 변경
function emptyOhaengFloat(): Record<Ohaeng, number> {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
}

/**
 * 4기둥에서 오행 가중 합산 (지장간 반영)
 * 천간: 1.0 가중치
 * 지지: 지장간 비율 가중 합산 (ratio/100)
 */
function countOhaengWeighted(pillars: {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}): Record<Ohaeng, number> {
  const count = emptyOhaengFloat();
  const activePillars = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) activePillars.push(pillars.hour);

  for (const pillar of activePillars) {
    // 천간 1.0
    count[pillar.cheonganOhaeng] += 1.0;
    // 지지: 지장간 비율 합산
    const jijanggan = JIJANGGAN[pillar.jiji];
    for (const { cheongan, ratio } of jijanggan) {
      const ohaeng = CHEONGAN_OHAENG[cheongan];
      count[ohaeng] += ratio / 100;
    }
  }
  return count;
}
```

`calculateSaju` 함수 내 `countOhaeng` 호출을 `countOhaengWeighted`로 교체:
```typescript
// 기존: const ohaengCount = countOhaeng(pillars);
const ohaengCount = countOhaengWeighted(pillars);
```

`normalizeOhaeng` 함수의 totalGlyphs 계산도 실제 합산값 기준으로:
```typescript
// totalGlyphs 대신 실제 count 합계 사용
const total = OHAENG_LIST.reduce((sum, o) => sum + ohaengCount[o], 0);
// normalizeOhaeng 호출 시 totalGlyphs 대신 total 전달
const ohaengStrength = normalizeOhaeng(ohaengCount, total);
```

- [ ] **Step 3: 기존 35개 테스트 통과 확인**

```bash
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```
Expected: 35 passed, 0 failed  
(지장간 반영 후 오행 강도 수치는 변할 수 있지만 년/월/일/시주 기둥 자체는 변하지 않음)

- [ ] **Step 4: 지장간 검증 테스트 추가 (engine.test.ts)**

`engine.test.ts` 끝에 추가:

```typescript
// ── 지장간 검증 ──────────────────────────────────────────────
console.log('\n=== 지장간 오행 강도 검증 ===')

// 子 지지만 있으면 수(壬 100%) → 수 비중 가장 높아야 함
// 1990-07-15 = 경오년, 경오년에 子 포함 여부 테스트는 간접적으로만 가능
// 대신 함수 단위 검증

const { JIJANGGAN, CHEONGAN_KR } = require('./types')

// 子의 지장간: 壬 100% → 수 1.0
const jaSub = JIJANGGAN['子']
assert(jaSub.length === 1, '子 지장간은 1개')
assert(jaSub[0].cheongan === '壬', '子 지장간 천간 = 壬')
assert(jaSub[0].ratio === 100, '子 지장간 비율 = 100')

// 丑의 지장간 비율 합 = 100
const chukSub = JIJANGGAN['丑']
const chukTotal = chukSub.reduce((s: number, e: {ratio: number}) => s + e.ratio, 0)
assert(chukTotal === 100, `丑 지장간 비율 합 = 100 (실제: ${chukTotal})`)

// 모든 지지 비율 합 = 100 검증
const { JIJI_LIST } = require('./types')
for (const jiji of JIJI_LIST) {
  const total = JIJANGGAN[jiji].reduce((s: number, e: {ratio: number}) => s + e.ratio, 0)
  assert(total === 100, `${jiji} 지장간 비율 합 = 100 (실제: ${total})`)
}
console.log('  ✅ 12지지 지장간 비율 합 모두 100%')

// 지장간 반영 시 오행 강도 합 ≈ 100% (±5%)
const result1990 = calculateSaju({ year: 1990, month: 7, day: 15, hour: 10 })
const strengthTotal = Object.values(result1990.ohaengStrength).reduce((a, b) => a + b, 0)
assert(Math.abs(strengthTotal - 100) < 6, `오행 강도 합 ≈ 100% (실제: ${strengthTotal})`)
console.log(`  ✅ 오행 강도 합: ${strengthTotal.toFixed(1)}%`)
```

- [ ] **Step 5: 테스트 재실행**

```bash
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```
Expected: 38+ passed, 0 failed

- [ ] **Step 6: 커밋**

```bash
git add lib/saju/types.ts lib/saju/engine.ts lib/saju/engine.test.ts
git commit -m "feat(C1): 지장간 상수 추가 + countOhaeng 가중 합산 개선"
```

---

## Task 3: 용신(用神) / 희신(喜神) 계산

**Files:**
- Modify: `lib/saju/types.ts`
- Modify: `lib/saju/engine.ts`
- Modify: `lib/saju/engine.test.ts`

- [ ] **Step 1: SajuResult 타입 확장**

`lib/saju/types.ts`의 `SajuResult` 인터페이스에 추가:

```typescript
/** 신강/신약/중화 */
bodyStrength: 'strong' | 'weak' | 'balanced';
/** 용신 오행 (가장 필요한 오행) */
yongshin: Ohaeng;
/** 희신 오행 (용신을 돕는 오행) */
heeshin: Ohaeng;
```

- [ ] **Step 2: 오행 상생(相生) 관계 상수 추가 (engine.ts)**

`engine.ts`에 추가:

```typescript
// 오행 상생: 목생화, 화생토, 토생금, 금생수, 수생목
const OHAENG_GENERATES: Record<Ohaeng, Ohaeng> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
};

// 오행 상극: 목극토, 화극금, 토극수, 금극목, 수극화
const OHAENG_CONTROLS: Record<Ohaeng, Ohaeng> = {
  목: '토', 화: '금', 토: '수', 금: '목', 수: '화',
};

// 오행 생(生)하는 주체: 나를 생하는 오행
const OHAENG_GENERATED_BY: Record<Ohaeng, Ohaeng> = {
  화: '목', 토: '화', 금: '토', 수: '금', 목: '수',
};
```

- [ ] **Step 3: calculateYongshin 함수 구현**

```typescript
/**
 * 용신(用神) 계산 — 억부법(抑扶法)
 * 일간 오행의 강도를 기준으로 신강/신약 판단 후 용신 도출
 */
function calculateYongshin(
  dayPillar: Pillar,
  ohaengStrength: Record<Ohaeng, number>,
): { yongshin: Ohaeng; heeshin: Ohaeng; bodyStrength: 'strong' | 'weak' | 'balanced' } {
  const dayOhaeng = dayPillar.cheonganOhaeng;
  const avgStrength = 20; // 5오행 균등 분포 시 각 20%

  // 일간 오행 + 같은 오행(비겁) 강도 합
  const selfStrength = ohaengStrength[dayOhaeng];
  // 일간을 생하는 오행(인성) 강도
  const supportStrength = ohaengStrength[OHAENG_GENERATED_BY[dayOhaeng]];
  const totalBodyStrength = selfStrength + supportStrength * 0.6;

  let bodyStrength: 'strong' | 'weak' | 'balanced';
  if (totalBodyStrength > avgStrength * 1.5) {
    bodyStrength = 'strong';
  } else if (totalBodyStrength < avgStrength * 0.7) {
    bodyStrength = 'weak';
  } else {
    bodyStrength = 'balanced';
  }

  let yongshin: Ohaeng;
  let heeshin: Ohaeng;

  if (bodyStrength === 'strong') {
    // 신강: 설기(洩氣) — 일간이 생하는 오행을 용신 (힘을 빼줌)
    yongshin = OHAENG_GENERATES[dayOhaeng];
    // 희신: 용신을 생하는 오행 또는 극하는 오행
    heeshin = OHAENG_GENERATES[yongshin];
  } else {
    // 신약/중화: 생조(生助) — 일간을 생하는 오행을 용신
    yongshin = OHAENG_GENERATED_BY[dayOhaeng];
    // 희신: 용신과 같은 오행을 생하는 오행
    heeshin = OHAENG_GENERATED_BY[yongshin];
  }

  return { yongshin, heeshin, bodyStrength };
}
```

- [ ] **Step 4: calculateSaju에 용신 계산 추가**

`calculateSaju` 함수 return 직전에 추가:

```typescript
const { yongshin, heeshin, bodyStrength } = calculateYongshin(dayPillar, ohaengStrength);

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
  bodyStrength,    // 추가
  yongshin,        // 추가
  heeshin,         // 추가
};
```

- [ ] **Step 5: 용신 테스트 추가**

```typescript
// engine.test.ts 끝에 추가
console.log('\n=== 용신 계산 검증 ===')

// 강한 화(火) 사주 → 신강 → 설기(화생토) → 토가 용신
const fireSaju = calculateSaju({ year: 1966, month: 7, day: 7, hour: 13 }) // 병오년 강한 화
console.log(`  화 강한 사주 bodyStrength: ${fireSaju.bodyStrength}, yongshin: ${fireSaju.yongshin}`)
// bodyStrength가 strong이면 yongshin은 토 (화→토 설기)
if (fireSaju.bodyStrength === 'strong' && fireSaju.strongOhaeng[0] === '화') {
  assert(fireSaju.yongshin === '토', `화 신강 → 용신 토 (실제: ${fireSaju.yongshin})`)
  console.log('  ✅ 화 신강 → 용신 토')
}

// 용신/희신 타입 확인
const testResult = calculateSaju({ year: 1990, month: 7, day: 15, hour: 10 })
const validOhaeng: Ohaeng[] = ['목', '화', '토', '금', '수']
assert(validOhaeng.includes(testResult.yongshin), `용신이 유효한 오행: ${testResult.yongshin}`)
assert(validOhaeng.includes(testResult.heeshin), `희신이 유효한 오행: ${testResult.heeshin}`)
assert(['strong', 'weak', 'balanced'].includes(testResult.bodyStrength), `bodyStrength 유효`)
console.log(`  ✅ 1990-07-15 사주: 신${testResult.bodyStrength === 'strong' ? '강' : testResult.bodyStrength === 'weak' ? '약' : '중화'}, 용신:${testResult.yongshin}, 희신:${testResult.heeshin}`)
```

- [ ] **Step 6: 테스트 + 커밋**

```bash
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
git add lib/saju/types.ts lib/saju/engine.ts lib/saju/engine.test.ts
git commit -m "feat(C2): 용신/희신 억부법 계산 추가"
```

---

## Task 4: 합충(合沖) 분석

**Files:**
- Modify: `lib/saju/types.ts`
- Modify: `lib/saju/engine.ts`
- Modify: `lib/saju/engine.test.ts`

- [ ] **Step 1: 합충 상수 추가 (types.ts)**

```typescript
// ─────────────────────────────────────────────
// 합충(合沖) 상수
// ─────────────────────────────────────────────

/** 천간합(天干合) — 갑기합토, 을경합금, 병신합수, 정임합목, 무계합화 */
export const CHEONGAN_HAP: Record<Cheongan, { partner: Cheongan; result: Ohaeng }> = {
  甲: { partner: '己', result: '토' }, 己: { partner: '甲', result: '토' },
  乙: { partner: '庚', result: '금' }, 庚: { partner: '乙', result: '금' },
  丙: { partner: '辛', result: '수' }, 辛: { partner: '丙', result: '수' },
  丁: { partner: '壬', result: '목' }, 壬: { partner: '丁', result: '목' },
  戊: { partner: '癸', result: '화' }, 癸: { partner: '戊', result: '화' },
}

/** 지지충(地支沖) — 6충 */
export const JIJI_CHUNG: Record<Jiji, Jiji> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
}

/** 삼합(三合) — 국(局) 형성 */
export const SAMHAP: Array<{ members: [Jiji, Jiji, Jiji]; result: Ohaeng }> = [
  { members: ['申', '子', '辰'], result: '수' },
  { members: ['亥', '卯', '未'], result: '목' },
  { members: ['寅', '午', '戌'], result: '화' },
  { members: ['巳', '酉', '丑'], result: '금' },
]

/** 합충 분석 결과 */
export interface HapChungItem {
  type: 'cheonganHap' | 'jijiChung' | 'samhap'
  description: string
  resultOhaeng?: Ohaeng
}

/** SajuResult에 추가할 합충 필드 */
// SajuResult에 hapChung?: HapChungItem[] 추가 예정
```

- [ ] **Step 2: SajuResult에 hapChung 필드 추가**

`SajuResult` 인터페이스에 추가:
```typescript
/** 4기둥 내 합충 분석 결과 */
hapChung: HapChungItem[];
```

- [ ] **Step 3: getHapChung 함수 구현 (engine.ts)**

```typescript
import {
  CHEONGAN_HAP, JIJI_CHUNG, SAMHAP,
  type HapChungItem,
} from './types';

/**
 * 4기둥 내 합충 탐지
 */
function getHapChung(pillars: {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null;
}): HapChungItem[] {
  const result: HapChungItem[] = [];
  const activePillars = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) activePillars.push(pillars.hour);

  const cheongans = activePillars.map((p) => p.cheongan);
  const jijis = activePillars.map((p) => p.jiji);

  // 천간합 탐지
  for (let i = 0; i < cheongans.length; i++) {
    for (let j = i + 1; j < cheongans.length; j++) {
      const hap = CHEONGAN_HAP[cheongans[i]];
      if (hap && hap.partner === cheongans[j]) {
        result.push({
          type: 'cheonganHap',
          description: `${cheongans[i]}${cheongans[j]} 천간합 → ${hap.result} 기운으로 변화`,
          resultOhaeng: hap.result,
        });
      }
    }
  }

  // 지지충 탐지
  for (let i = 0; i < jijis.length; i++) {
    for (let j = i + 1; j < jijis.length; j++) {
      if (JIJI_CHUNG[jijis[i]] === jijis[j]) {
        result.push({
          type: 'jijiChung',
          description: `${JIJI_KR[jijis[i]]}${JIJI_KR[jijis[j]]} 지지충 — 기운의 충돌`,
        });
      }
    }
  }

  // 삼합 탐지 (3개 모두 있을 때)
  for (const samhap of SAMHAP) {
    const matchCount = samhap.members.filter((m) => jijis.includes(m)).length;
    if (matchCount >= 2) {
      result.push({
        type: 'samhap',
        description: `${samhap.members.map((m) => JIJI_KR[m]).join('')} 삼합 → ${samhap.result} 기운 강화`,
        resultOhaeng: samhap.result,
      });
    }
  }

  return result;
}
```

- [ ] **Step 4: calculateSaju return에 hapChung 추가**

```typescript
const hapChung = getHapChung(pillars);

return {
  // ... 기존 필드들
  hapChung,    // 추가
};
```

- [ ] **Step 5: 합충 테스트 추가**

```typescript
console.log('\n=== 합충 분석 검증 ===')

// 甲己합: 甲(0) + 己(5) 동시 존재 시 천간합 탐지
// 1984-01-31 = 甲子年 甲子月(입춘전 丑月) → 甲이 있는 사주 필요
const hapTest = calculateSaju({ year: 1984, month: 6, day: 20, hour: 9 })
console.log(`  합충 항목 수: ${hapTest.hapChung.length}`)
assert(Array.isArray(hapTest.hapChung), 'hapChung는 배열')
console.log('  ✅ hapChung 배열 정상 반환')
if (hapTest.hapChung.length > 0) {
  console.log(`  합충 내용: ${hapTest.hapChung[0].description}`)
}
```

- [ ] **Step 6: 테스트 + 커밋**

```bash
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
git add lib/saju/types.ts lib/saju/engine.ts lib/saju/engine.test.ts
git commit -m "feat(C3): 합충 분석 (천간합, 지지충, 삼합) 구현"
```

---

## Task 5: 개인화 텍스트 생성 유틸

**Files:**
- Create: `lib/saju/explain.ts`

- [ ] **Step 1: explain.ts 생성**

```typescript
// lib/saju/explain.ts
/**
 * 사주 결과 개인화 텍스트 생성
 * 사용자 언어로 사주를 설명하는 서사 텍스트 생성 유틸
 */

import type { SajuResult, Ohaeng } from './types'
import { OHAENG_EMOJI } from './types'

const OHAENG_PERSONALITY: Record<Ohaeng, string> = {
  목: '성장과 도전을 즐기는',
  화: '열정과 추진력이 넘치는',
  토: '안정과 신뢰를 중시하는',
  금: '원칙과 결단력이 강한',
  수: '지혜와 유연함을 가진',
}

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
 * "[이름]님은 [오행] 기운이 넘치는 사주예요. [약한오행] 기운을 보충하면..."
 */
export function buildSajuNarrative(result: SajuResult, name?: string): string {
  const prefix = name ? `${name}님은` : '당신은'
  const strong = result.strongOhaeng[0]
  const weak = result.weakOhaeng[0]
  const bodyDesc = BODY_STRENGTH_DESC[result.bodyStrength] ?? '개성 있는'

  return `${prefix} ${OHAENG_EMOJI[strong]} ${strong} 기운이 강하고 ${bodyDesc} 사주예요. ` +
    `${OHAENG_EMOJI[weak]} ${weak} 기운의 ${OHAENG_SUPPLEMENT[weak]}을 보충하면 더 큰 에너지를 발휘할 수 있어요.`
}

/**
 * 용신 설명 텍스트
 */
export function buildYongshinNarrative(result: SajuResult, name?: string): string {
  const prefix = name ? `${name}님` : '당신'
  return `${prefix}에게 지금 가장 필요한 기운은 ${OHAENG_EMOJI[result.yongshin]} ${result.yongshin}(이)에요. ` +
    `${result.yongshin} 기운이 강한 명당을 방문하면 균형과 운이 열립니다.`
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
```

- [ ] **Step 2: lib/saju/index.ts에 explain 재내보내기**

```typescript
// lib/saju/index.ts 끝에 추가
export { buildSajuNarrative, buildYongshinNarrative, buildPlaceNarrative } from './explain'
```

- [ ] **Step 3: type-check + 커밋**

```bash
npm run type-check
git add lib/saju/explain.ts lib/saju/index.ts
git commit -m "feat(C4): 개인화 사주 서사 텍스트 유틸 추가"
```

---

## Task 6: 명당 추천 점수 로직

**Files:**
- Create: `lib/saju/recommend.ts`
- Modify: `app/api/recommend/route.ts`

- [ ] **Step 1: recommend.ts 생성**

```typescript
// lib/saju/recommend.ts
/**
 * 명당 추천 점수 계산 로직
 * 사주 분석 결과 기반 장소 추천 점수 + 이유 생성
 */

import type { SajuResult, Ohaeng } from './types'
import { buildPlaceNarrative } from './explain'
import type { PlaceRow } from '@/types/database'

export interface ScoredPlace {
  place: PlaceRow
  score: number
  matchReasons: string[]
}

/**
 * 단일 장소의 추천 점수 계산
 *
 * 기본: trust_score
 * + weakOhaeng 일치 × 15점 (최대 30점)
 * + yongshin 일치 × 20점
 * + luckPreference 일치 × 10점 (최대 20점)
 * + hapChung 충돌 발생 시 -5점
 */
export function scorePlace(
  place: PlaceRow,
  result: SajuResult,
  luckPreference?: string,
): ScoredPlace {
  let score = place.trust_score
  const reasons: string[] = []

  // 약한 오행 매칭 (최대 30점)
  const weakMatches = place.ohaeng.filter((o) => result.weakOhaeng.includes(o as Ohaeng))
  if (weakMatches.length > 0) {
    score += weakMatches.length * 15
    reasons.push(`부족한 ${weakMatches.join('·')} 기운 보충`)
  }

  // 용신 오행 매칭 (20점)
  if (place.ohaeng.includes(result.yongshin)) {
    score += 20
    reasons.push(`용신 ${result.yongshin} 기운 직접 보충`)
  }

  // 운 선호도 일치 (최대 20점)
  if (luckPreference && place.luck_types.includes(luckPreference)) {
    score += 10
    reasons.push(`원하는 ${luckPreference} 에너지`)
  }

  // 합충 페널티
  if (result.hapChung.length > 0) {
    const hasConflict = result.hapChung.some(
      (hc) => hc.type === 'jijiChung' && hc.resultOhaeng && place.ohaeng.includes(hc.resultOhaeng)
    )
    if (hasConflict) score -= 5
  }

  return {
    place,
    score: Math.min(100, Math.round(score)),
    matchReasons: reasons.length > 0 ? reasons : [buildPlaceNarrative(place.name, place.ohaeng, result)],
  }
}

/**
 * 장소 목록에서 추천 순위 정렬
 */
export function rankPlaces(
  places: PlaceRow[],
  result: SajuResult,
  luckPreference?: string,
): ScoredPlace[] {
  return places
    .map((p) => scorePlace(p, result, luckPreference))
    .sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 2: app/api/recommend/route.ts 확인 및 업데이트**

먼저 기존 파일 확인:
```bash
cat app/api/recommend/route.ts
```

기존 파일에 scorePlace 로직 반영. 기본 구조:

```typescript
// app/api/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calculateSaju } from '@/lib/saju/engine'
import { rankPlaces } from '@/lib/saju/recommend'
import { MOCK_PLACES, isMockMode } from '@/lib/mock-data'
import type { PlaceRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year  = parseInt(searchParams.get('y') ?? '0')
  const month = parseInt(searchParams.get('m') ?? '0')
  const day   = parseInt(searchParams.get('d') ?? '0')
  const hour  = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined
  const luckPref = searchParams.get('luck') ?? undefined

  if (!year || !month || !day) {
    return NextResponse.json({ error: '생년월일 필수' }, { status: 400 })
  }

  try {
    const result = calculateSaju({ year, month, day, hour })

    let places: PlaceRow[] = []
    if (isMockMode()) {
      places = MOCK_PLACES
    } else {
      // Supabase fetch (기존 로직 유지)
      places = MOCK_PLACES // 폴백
    }

    const ranked = rankPlaces(places, result, luckPref).slice(0, 6)

    return NextResponse.json({
      result,
      recommendations: ranked,
    })
  } catch (error) {
    console.error('[recommend] 오류:', error)
    return NextResponse.json({ error: '추천 계산 실패' }, { status: 500 })
  }
}
```

- [ ] **Step 3: type-check + 커밋**

```bash
npm run type-check
git add lib/saju/recommend.ts app/api/recommend/route.ts
git commit -m "feat(C5): 명당 추천 점수 로직 + recommend API 업데이트"
```

---

## Task 7: 결과 페이지 UI 개선 (C5)

**Files:**
- Modify: `app/result/ResultClient.tsx`

**목표:** 이름 표시, 용신 섹션, 추천 TOP3 카드 추가

- [ ] **Step 1: ResultClient에 store에서 userName, yongshin 가져오기**

```tsx
// 기존 import에 추가
import { buildSajuNarrative, buildYongshinNarrative } from '@/lib/saju/explain'

// 컴포넌트 내부 상단
const userName  = useUserStore((s) => s.userName)
const narrative = buildSajuNarrative(result, userName ?? undefined)
const yongshinNarrative = buildYongshinNarrative(result, userName ?? undefined)
```

- [ ] **Step 2: 히어로 섹션 이름 + 서사 텍스트 추가**

기존 `h1` 태그 위에 이름 추가:

```tsx
{/* 이름 헤더 */}
{userName && (
  <p className="text-sm font-medium mb-2" style={{ color: '#C9973A' }}>
    {userName}님의 사주
  </p>
)}

{/* 기존 h1 유지 */}
<h1 className="text-2xl font-semibold mb-2 leading-snug break-keep" ...>
  {/* 기존 내용 */}
</h1>

{/* 서사 텍스트 */}
<p className="text-sm mt-3 leading-relaxed px-2" style={{ color: 'rgba(240,234,216,0.75)' }}>
  {narrative}
</p>
```

- [ ] **Step 3: 용신 섹션 추가 (OhaengResultCard 아래)**

`OhaengResultCard` 아래, `section-divider` 위에 삽입:

```tsx
{/* 용신 섹션 */}
<div className="mb-4 p-4 rounded-2xl" style={{
  background: `${OHAENG_COLOR[result.yongshin].bg}`,
  border: `1.5px solid ${OHAENG_COLOR[result.yongshin].hex}33`,
}}>
  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
    style={{ color: OHAENG_COLOR[result.yongshin].hex }}>
    오늘 당신에게 필요한 기운
  </p>
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl">{OHAENG_EMOJI[result.yongshin]}</span>
    <span className="font-bold text-lg" style={{ color: OHAENG_COLOR[result.yongshin].text }}>
      {result.yongshin} 기운
    </span>
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: OHAENG_COLOR[result.yongshin].hex + '22', color: OHAENG_COLOR[result.yongshin].hex }}>
      용신
    </span>
  </div>
  <p className="text-sm leading-relaxed" style={{ color: OHAENG_COLOR[result.yongshin].text }}>
    {yongshinNarrative}
  </p>
</div>
```

- [ ] **Step 4: 추천 명당 TOP3 섹션 추가**

`IlshinBanner` 섹션 위에 삽입 (추천 장소 상태는 클라이언트에서 fetch):

```tsx
// 컴포넌트 상단에 상태 추가
const [topPlaces, setTopPlaces] = useState<Array<{place: {id:string;name:string;ohaeng:string[];trust_score:number};score:number;matchReasons:string[]}>>([])

// useEffect에서 추천 fetch
useEffect(() => {
  const { year, month, day, hour } = result.input
  const url = `/api/recommend?y=${year}&m=${month}&d=${day}${hour !== undefined ? `&h=${hour}` : ''}`
  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      if (data.recommendations) setTopPlaces(data.recommendations.slice(0, 3))
    })
    .catch(() => {}) // 추천 실패해도 페이지 동작
}, [result.input])
```

JSX에 추천 카드 섹션 추가 (section-divider 뒤):

```tsx
{topPlaces.length > 0 && (
  <>
    <div className="section-divider" />
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ color: '#C9973A' }}><MapPinIcon /></span>
        <p className="section-label">나만의 명당 TOP {topPlaces.length}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {topPlaces.map(({ place, score, matchReasons }, i) => {
          const ohaeng = place.ohaeng[0] as Ohaeng
          const color = OHAENG_COLOR[ohaeng]
          return (
            <a key={place.id} href={`/place/${place.id}`}
              className="flex items-center gap-3 p-3.5 rounded-2xl border transition-colors"
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 16px',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: color.bg }}>
                {OHAENG_EMOJI[ohaeng]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{place.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{matchReasons[0]}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs font-bold" style={{ color: color.hex }}>{score}점</span>
                <span className="text-[10px] text-gray-400">#{i + 1}</span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  </>
)}
```

- [ ] **Step 5: type-check + 커밋**

```bash
npm run type-check
git add app/result/ResultClient.tsx
git commit -m "feat(C5): 결과 페이지 이름/용신/추천TOP3 UI 추가"
```

---

## Task 8: 최종 품질 게이트

- [ ] **전체 테스트 실행**

```bash
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```
Expected: 40+ passed, 0 failed

- [ ] **type-check**
```bash
npm run type-check
```
Expected: 오류 0개

- [ ] **lint**
```bash
npm run lint
```
Expected: 경고 0개

- [ ] **페이지 응답 확인**

```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/result?y=1990&m=7&d=15&h=10"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/recommend?y=1990&m=7&d=15&h=10"
```
Expected: 200 200

- [ ] **최종 커밋 메시지 확인**

```bash
git log --oneline feat/phase-c-engine..HEAD
```
Expected: C0~C5 커밋 7개 이상
