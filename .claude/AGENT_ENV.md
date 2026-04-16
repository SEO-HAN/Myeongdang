# 명당지도 에이전트 환경 명세 (AGENT_ENV)
<!-- Claude 하네스 설계 문서. 새 세션에서 에이전트 역할 분담이 필요할 때 참조 -->

## 환경 개요

명당지도는 단일 Claude 세션에서 오케스트레이터 패턴으로 작업을 진행한다.
복잡한 작업(사주 엔진 변경, 대규모 UI 리디자인)의 경우 서브에이전트(Task tool)를 활용하여
병렬 검증을 수행한다.

## 에이전트 역할 정의

### 1. Orchestrator (기본 세션)
**역할:** 계획 수립, 작업 순서 결정, 서브에이전트 조율, 품질 게이트 통과 확인  
**권한:** 모든 파일 읽기/쓰기, Bash 실행, 서브에이전트 생성  
**책임:**
- MASTERPLAN.md 체크박스 업데이트
- WORKLOG.md 세션 항목 작성
- 각 단계 DoD 검증
- Phase 간 전환 결정

### 2. UI Specialist (서브에이전트 — Phase B)
**활성화 조건:** B1~B5 작업 시 병렬 검토 필요할 때  
**역할:** React 컴포넌트 설계, Tailwind 클래스 검토, 모바일 UX 검증  
**규칙:**
- R1(Server/Client 경계) 위반 여부 검사
- 375px 모바일 뷰포트 기준 레이아웃 검토
- framer-motion 애니메이션 성능 체크

### 3. Saju Engine Validator (서브에이전트 — Phase C)
**활성화 조건:** 사주 엔진 로직 변경 시  
**역할:** 35개 기존 테스트 케이스 실행, 엣지 케이스 발견  
**실행 명령:**
```bash
cat > /tmp/tsconfig_test.json << 'EOF'
{"compilerOptions":{"target":"ES2020","module":"commonjs","moduleResolution":"node","lib":["ES2020","dom"],"types":["node"],"strict":true,"esModuleInterop":true}}
EOF
cd /path/to/project && npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts
```

### 4. Security Reviewer (서브에이전트 — 배포 전)
**활성화 조건:** Phase D 배포 전  
**역할:** 환경변수 노출 검사, RLS 정책 검토, API 인증 검증  
**체크리스트:**
- `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 코드에 없음
- 모든 Route Handler에 인증 검증
- `NEXT_PUBLIC_` 변수 목록 검토

### 5. SEO Auditor (서브에이전트 — Phase D)
**활성화 조건:** 배포 직전 SEO 검증  
**역할:** JSON-LD 구조화 데이터 검증, OG 태그 확인, Lighthouse 지표  
**목표 점수:** Performance 90+, SEO 95+, Accessibility 85+

---

## 품질 게이트 (Quality Gates)

각 Phase 완료 전 반드시 통과해야 하는 자동 검증:

```bash
# Gate 1: TypeScript 오류 없음
npm run type-check

# Gate 2: ESLint 오류 없음
npm run lint

# Gate 3: 빌드 성공
npm run build

# Gate 4: 사주 엔진 테스트 (엔진 변경 시만)
npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts

# Gate 5: 핵심 API 응답 검증
curl -s localhost:3000/api/places | jq '.count'          # 30 이상
curl -s localhost:3000/api/saju -X POST \
  -H "Content-Type: application/json" \
  -d '{"year":1990,"month":3,"day":15,"hour":10}' | jq '.data.pillars'
```

---

## 훅 시스템 현황

```json
// .claude/settings.json 훅 구성
{
  "SessionStart": ".claude/hooks/session-start.sh",    // 상태 표시
  "PreToolUse[Bash]": ".claude/hooks/bash-guard.sh",  // 위험 명령 차단
  "PreToolUse[Write]": ".claude/hooks/write-validator.sh", // 경로 검증
  "PostToolUse[Write]": ".claude/hooks/ts-lint.sh",   // TS 린팅
  "Stop": ".claude/hooks/stop-gate.sh"                // 완료 조건 확인
}
```

---

## 컨텍스트 효율화 전략

1. **새 세션 초기화 순서:**
   ```
   1. CLAUDE.md 읽기 (자동 주입)
   2. MASTERPLAN.md → 현재 Phase/Step 확인
   3. WORKLOG.md → NEXT 섹션 확인
   4. 대상 파일만 Read (전체 코드베이스 읽지 않음)
   ```

2. **파일 읽기 우선순위:**
   - 수정할 파일만 읽기
   - 관련 types/database.ts 필요 시 읽기
   - 엔진 변경 시에만 lib/saju/engine.ts 전체 읽기

3. **메모리 파일 위치:**
   ```
   /sessions/tender-dreamy-cannon/mnt/.auto-memory/
   ├── MEMORY.md          — 인덱스
   ├── project_state.md   — 현재 프로젝트 상태
   ├── user_profile.md    — 사용자 역할/선호
   └── feedback_rules.md  — 작업 방식 피드백
   ```

---

## 의사결정 로그

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-16 | Mock 모드 isMockMode() 함수로 단일화 | 조건 분기를 한 곳에서 관리 |
| 2026-04-16 | DevMap SVG 대체 컴포넌트 구현 | Kakao API 없이 로컬 개발 가능 |
| 2026-04-16 | not-found.tsx `'use client'` 추가 | styled-jsx Server Component 불호환 |
| 2026-04-16 | MASTERPLAN → WORKLOG → AGENT_ENV 구조 채택 | 컨텍스트 낭비 없는 세션 복원 |

