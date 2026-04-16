#!/bin/bash
# ============================================================
# 명당지도 — SessionStart 훅
# 역할: 세션 시작 시 개발 환경 검증 + 프로젝트 상태 보고
# 이벤트: SessionStart (startup | resume | clear)
# ============================================================

set -uo pipefail

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
INPUT=$(cat)
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"')

# ── 검증 결과 수집 ───────────────────────────────────────────
WARNINGS=()
INFO=()

# 1. .env.local 존재 여부
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
  WARNINGS+=("⚠️  .env.local 없음 — Kakao/Supabase 키 미설정. .env.local.example 참고")
else
  # 필수 변수 존재 여부 확인
  for VAR in NEXT_PUBLIC_KAKAO_MAP_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_APP_URL; do
    if ! grep -q "^${VAR}=" "$PROJECT_DIR/.env.local" 2>/dev/null; then
      WARNINGS+=("⚠️  .env.local에 ${VAR} 없음")
    fi
  done
fi

# 2. node_modules 설치 여부
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  WARNINGS+=("⚠️  node_modules 없음 — npm install 실행 필요")
fi

# 3. 현재 개발 단계 정보 (MASTERPLAN.md에서 읽기)
if [ -f "$PROJECT_DIR/MASTERPLAN.md" ]; then
  CURRENT_PHASE=$(grep -m1 "^\*\*단계:\*\*" "$PROJECT_DIR/MASTERPLAN.md" | sed 's/\*\*단계:\*\* //')
  NEXT_TODO=$(grep -A3 "^## ⏭️ NEXT" "$PROJECT_DIR/WORKLOG.md" 2>/dev/null | grep "^\*\*Phase" | head -1 | sed 's/\*\*//g')
  INFO+=("📍 현재 단계: ${CURRENT_PHASE:-MASTERPLAN.md 확인 필요}")
  [ -n "$NEXT_TODO" ] && INFO+=("⏭️  다음 작업: ${NEXT_TODO}")
else
  INFO+=("📍 현재 단계: F단계 완료 → Phase B (UX/UI 리디자인) 대기")
fi
INFO+=("📁 총 파일: $(find "$PROJECT_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' ! -path '*/.next/*' | wc -l | tr -d ' ')개 TS/TSX 파일")

# 4. TypeScript 타입 오류 빠른 체크 (resume 세션에서만)
if [ "$SOURCE" = "resume" ] && [ -d "$PROJECT_DIR/node_modules" ]; then
  TS_ERRORS=$(cd "$PROJECT_DIR" && npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
  if [ "$TS_ERRORS" -gt 0 ]; then
    WARNINGS+=("🔴 TypeScript 오류 ${TS_ERRORS}개 감지 — npm run type-check로 확인")
  else
    INFO+=("✅ TypeScript 타입 체크 통과")
  fi
fi

# 5. 사주 엔진 테스트 tsconfig 확인
if [ ! -f /tmp/tsconfig_test.json ]; then
  cat > /tmp/tsconfig_test.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2020", "dom"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": "."
  }
}
EOF
  INFO+=("📝 /tmp/tsconfig_test.json 자동 생성 (사주 엔진 테스트용)")
fi

# ── 컨텍스트 조합 ────────────────────────────────────────────
CONTEXT="=== 명당지도 세션 시작 (${SOURCE}) ===\n"

if [ ${#INFO[@]} -gt 0 ]; then
  CONTEXT+="\n📊 프로젝트 상태:\n"
  for item in "${INFO[@]}"; do
    CONTEXT+="  ${item}\n"
  done
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  CONTEXT+="\n🚨 주의 사항:\n"
  for w in "${WARNINGS[@]}"; do
    CONTEXT+="  ${w}\n"
  done
fi

CONTEXT+="\n💡 핵심 명령어:\n"
CONTEXT+="  npm run dev        → 개발 서버 (Mock 모드: NEXT_PUBLIC_MOCK_MODE=true)\n"
CONTEXT+="  npm run type-check → TS 검증\n"
CONTEXT+="  npm run build      → 프로덕션 빌드\n"
CONTEXT+="  [사주 엔진 테스트] → npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts\n"
CONTEXT+="\n📋 컨텍스트 복원 순서:\n"
CONTEXT+="  1. MASTERPLAN.md → 현재 Phase/Step 확인\n"
CONTEXT+="  2. WORKLOG.md    → NEXT 섹션 다음 작업 확인\n"
CONTEXT+="  3. 수정할 파일만 Read (전체 읽기 금지)\n"

# ── JSON 응답 출력 ────────────────────────────────────────────
printf '%s' "$CONTEXT" | jq -Rs '{additionalContext: .}'

exit 0
