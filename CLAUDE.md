# 명당지도 — Claude 하네스 컨텍스트

<!-- 유지보수 노트: 200줄 이하 유지. 상세 규칙은 .claude/rules/ 참조 -->

## 서비스 아이덴티티

**명당지도**는 사주(四柱) 오행(五行) 분석으로 사용자에게 맞는 풍수 명당을 카카오 지도 위에 시각화하는 모바일 웹 서비스다.

- 핵심 도메인: 사주팔자 × 풍수지리 × 지도
- 타깃: 한국 MZ, 모바일 퍼스트, 카카오톡 바이럴 공유
- 현재 단계: **F단계 완료** (카카오 OAuth, 일진, 장소 수집 파이프라인) → G단계 대기 (리뷰/댓글, 관리자 대시보드, 푸시 알림)

## 기술 스택 & 핵심 의존성

```
Next.js 14 App Router   │ React 18 Server/Client 컴포넌트
Supabase + @supabase/ssr│ RLS 기반 DB + Auth 세션 관리
Zustand 4 (persist)     │ skipHydration 패턴 — SSR 안전
Kakao Maps SDK          │ autoload=false, dynamic(ssr:false)
framer-motion 11        │ AnimatePresence, drag
@vercel/og (Edge)       │ OG 이미지 API — /api/og
```

## 빌드 & 테스트 명령어

```bash
npm run dev              # 개발 서버 (localhost:3000)
npm run build            # 프로덕션 빌드 (오류 없어야 함)
npm run type-check       # TypeScript 검증 (tsc --noEmit)
npm run lint             # ESLint (next lint)

# 사주 엔진 35개 단위 테스트 (엔진 수정 시 필수 실행)
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```

**ts-node용 임시 tsconfig**가 없으면 생성:
```bash
cat > /tmp/tsconfig_test.json << 'EOF'
{"compilerOptions":{"target":"ES2020","module":"commonjs","moduleResolution":"node","lib":["ES2020","dom"],"types":["node"],"strict":true,"esModuleInterop":true}}
EOF
```

## 디렉토리 아키텍처

```
app/
├── page.tsx             ← Server Component, revalidate=60, 초기 places fetch
├── MapClient.tsx        ← Client Component, Zustand rehydrate, dynamic import
├── api/                 ← Route Handlers
│   ├── places/route.ts  ← GET ?ohaeng=&luck=&type=&limit=
│   ├── saju/route.ts    ← POST { year, month, day, hour }
│   ├── recommend/route.ts ← GET ?weak=
│   └── og/route.ts      ← Edge runtime, ImageResponse 1200×630
├── onboarding/page.tsx  ← 'use client', 4단계 폼
├── result/
│   ├── page.tsx         ← Server Component, generateMetadata (동적 OG)
│   └── ResultClient.tsx ← 'use client', Zustand sync
└── place/[id]/page.tsx  ← Server Component, JSON-LD, generateMetadata

components/
├── map/                 ← KakaoMap, OhaengFilterBar, PlaceBottomSheet, PersonalizationBanner
├── saju/                ← BirthInputForm, OhaengRadarChart, OhaengResultCard, QuickTestForm, IlshinBanner
├── auth/                ← KakaoLoginButton (3 variants: full/compact/icon)
└── share/               ← ShareCard (Canvas API)

lib/
├── saju/
│   ├── engine.ts        ← calculateSaju(), buildOhaengFilter()
│   ├── ilshin.ts        ← getIlshin(), getTodayIlshin(), 개운 점수 계산
│   ├── types.ts         ← 모든 도메인 타입 & 상수
│   └── index.ts         ← 공개 API 재내보내기 (ilshin 포함)
├── kakao-map.ts         ← withKakao(), buildMarkerHTML()
├── supabase.ts          ← createServerClient, createBrowserClient
└── utils.ts             ← cn(), getOhaengHex(), calcDistance()

store/user-store.ts      ← Zustand persist(skipHydration:true)
middleware.ts            ← Supabase 세션 갱신 + 보안 헤더

scripts/                 ← 장소 자동 수집 파이프라인 (F단계 추가)
├── collect-places.ts    ← CLI: Naver API → Claude Haiku 태깅 → Supabase upsert
└── lib/
    ├── naver-search.ts  ← 네이버 지역 검색 API 클라이언트
    └── ohaeng-tagger.ts ← Claude Haiku 기반 오행 자동 태깅
```

## 절대 규칙 (위반 불가)

### R1 — Server / Client 컴포넌트 경계
```
Server Component  → 'use client' 없음, useState/useEffect 금지
Client Component  → 파일 첫 줄에 반드시 'use client'
의심스러우면      → 서버가 기본값, 필요할 때만 클라이언트화
```

### R2 — Supabase 클라이언트 선택
```typescript
// Server Component / Route Handler / middleware
import { createServerClient } from '@supabase/ssr'
const supabase = createServerClient(URL, ANON_KEY, { cookies })

// Client Component
import { createBrowserClient } from '@supabase/ssr'
const supabase = createBrowserClient(URL, ANON_KEY)

// ❌ 절대 금지: createClient from @supabase/supabase-js (SSR 불호환)
```

### R3 — Zustand SSR 안전 패턴
```typescript
// store 정의: persist({ skipHydration: true, ... })
// Client Component 마운트 시:
useEffect(() => { useUserStore.persist.rehydrate() }, [])
// ❌ 절대 금지: skipHydration 없는 persist
```

### R4 — Kakao Maps 초기화 순서
```typescript
// 1) dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })
// 2) withKakao(callback) → callback 안에서 map 초기화
// ❌ 절대 금지: window.kakao.maps 직접 접근 (SDK 미로드 가능성)
```

### R5 — 환경변수 보안
```
NEXT_PUBLIC_*   → 클라이언트 노출 허용
그 외           → 서버 전용 (Route Handler, Server Component)
SUPABASE_SERVICE_ROLE_KEY → 절대 클라이언트 노출 금지
```

### R6 — OG 이미지 URL
```typescript
// 항상 절대 URL 사용 (상대 URL은 OG 크롤러에서 동작 안 함)
`${process.env.NEXT_PUBLIC_APP_URL}/api/og?y=${y}&m=${m}&d=${d}`
```

## 도메인 지식 — 사주 오행

```
오행: 목(木)🌳 화(火)🔥 토(土)🏔️ 금(金)⚡ 수(水)💧
천간: 갑을병정무기경신임계 (10개, 음양오행)
지지: 자축인묘진사오미신유술해 (12개)
4기둥: 년주/월주/일주/시주 (각각 천간+지지 = 8글자)
계산 기준:
  년주  → (year-4)%10 천간, (year+8)%12 지지
  월주  → 24절기(입춘 기준), 五虎遁月法
  일주  → 1900-01-31 甲子日 앵커 + 날짜 오프셋
  시주  → 12지시(23시→자시), 五鼠遁時法
```

## 오행 매핑 파일

```typescript
// lib/saju/types.ts
OHAENG_EMOJI  // { 목:'🌳', 화:'🔥', 토:'🏔️', 금:'⚡', 수:'💧' }
OHAENG_COLOR  // { 목:{bg:'...', text:'...', hex:'...'}, ... }
OHAENG_LUCK   // { 목:['건강운','성장운'], 화:['열정운','사업운'], ... }
```

## 현재 30개 시드 데이터

서울 15곳 + 전국 15곳. `supabase/migrations/002_seed_data.sql` 참조.
각 장소: ohaeng TEXT[], luck_types TEXT[], trust_score, expert_verified, reason_text(풍수 근거)

## 멀티 에이전트 구조

```
Orchestrator (이 세션)
    ├── 🔮 SajuExpert      — 사주 도메인 전문가 (Phase C)
    ├── 🎨 UXDesigner      — UX/UI 설계 & 검증 (Phase B)
    ├── ⚡ DevEngineer     — Next.js/Supabase 구현 (전 Phase)
    ├── 🧪 QAVerifier      — 계산 정확도 & 품질 게이트 (전 Phase)
    └── 📊 PMAnalyst       — 지표 분석 & 우선순위 (계획 단계)
```

### 에이전트별 역할 & 권한

| 에이전트 | 담당 파일 범위 | 활성화 조건 | 금지사항 |
|---------|--------------|------------|---------|
| SajuExpert | `lib/saju/**` | Phase C 또는 사주 계산 수정 시 | 엔진 외부에서 직접 계산 |
| UXDesigner | `components/**`, `app/onboarding/**`, `app/result/**` | Phase B UX 변경 시 | 데스크탑 우선 설계 |
| DevEngineer | `app/**`, `lib/**`, `store/**` | 구현 작업 전반 | 클라이언트에 서버 전용 키 노출 |
| QAVerifier | `**/*.test.ts`, 품질 게이트 | Phase 완료 전 검증 | Mock DB를 실제 DB로 교체 |
| PMAnalyst | `MASTERPLAN.md`, `WORKLOG.md` | Phase 전환 결정 시 | 검증 없는 Phase 완료 선언 |

> 상세 에이전트 환경: `.claude/AGENT_ENV.md`  
> 에이전트별 도메인 규칙: `.claude/rules/` (saju-domain-deep, ux-design, performance, testing-strategy)

---

## 현재 진행 상태

> **새 세션 시작 시 아래 파일을 순서대로 읽어 컨텍스트를 복원하세요**

```
1. MASTERPLAN.md   → 현재 Phase/Step + 체크리스트 확인
2. WORKLOG.md      → NEXT 섹션에서 다음 작업 확인
3. .claude/AGENT_ENV.md → 에이전트 역할 / 품질 게이트 (필요 시)
```

| 항목 | 상태 |
|------|------|
| 현재 Phase | **B (UX/UI 리디자인)** |
| 완료된 Phase | A (Mock 환경 + 파일 기반 지속성) |
| 다음 작업 | B1 — 온보딩 플로우 재설계 |
| Mock 서버 | `npm run dev` → localhost:3000 (Supabase/Kakao 없이 동작) |

## 가비지 컬렉션 — 컨텍스트 관리

- **이 파일**: 200줄 이하 유지. 상세는 `.claude/rules/`로 분산
- **자동 메모리**: `~/.claude/projects/…/memory/` — 디버깅 인사이트 자동 기록
- **규칙 파일**: 경로 스코핑으로 관련 없는 규칙은 컨텍스트 미로드
- **컴팩션 후**: CLAUDE.md는 자동 재주입. 서브디렉토리 CLAUDE.md는 해당 파일 접근 시 재로드

## 추가 파일 임포트

@package.json

---
<!-- 최종 업데이트: E단계 완료 기준 (2026-04) -->
