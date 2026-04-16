#!/bin/bash
# ============================================================
# 명당지도 — PostToolUse(Write/Edit) 훅
# 역할: 파일 쓰기 후 자동 교정 루프
#        1) TypeScript 타입 오류 감지
#        2) 사주 엔진 파일 수정 시 테스트 트리거
#        3) 결과를 additionalContext로 Claude에 피드백
# 이벤트: PostToolUse, matcher: Write|Edit|MultiEdit
# ============================================================

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
PROJECT_DIR="$CLAUDE_PROJECT_DIR"

FEEDBACK=""
HAS_ERROR=false

# node_modules가 없으면 스킵 (CI 환경 등)
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  exit 0
fi

# ── 변경 파일이 TS/TSX인 경우만 처리 ─────────────────────────
if ! echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

# ── 1. TypeScript 타입 체크 (변경된 파일만 빠르게) ─────────────
# 전체 빌드 대신 해당 파일만 타입 체크
TS_OUTPUT=$(cd "$PROJECT_DIR" && npx tsc --noEmit --incremental false 2>&1 | head -30 || true)
TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)

if [ "$TS_ERRORS" -gt 0 ]; then
  HAS_ERROR=true
  FEEDBACK+="🔴 TypeScript 오류 ${TS_ERRORS}개:\n"
  # 변경 파일 관련 오류만 필터
  RELATED=$(echo "$TS_OUTPUT" | grep "$(basename "$FILE_PATH")" | head -5 || echo "$TS_OUTPUT" | head -5)
  FEEDBACK+="${RELATED}\n\n"
else
  FEEDBACK+="✅ TypeScript 타입 체크 통과\n"
fi

# ── 2. 사주 엔진 파일 수정 감지 → 자동 테스트 ──────────────────
if echo "$FILE_PATH" | grep -qE 'lib/saju/(engine|types)\.ts$'; then
  FEEDBACK+="\n🧪 사주 엔진 파일 수정 감지 — 단위 테스트 실행 중...\n"

  # /tmp/tsconfig_test.json 보장
  if [ ! -f /tmp/tsconfig_test.json ]; then
    cat > /tmp/tsconfig_test.json << 'EOF'
{"compilerOptions":{"target":"ES2020","module":"commonjs","moduleResolution":"node","lib":["ES2020","dom"],"types":["node"],"strict":true,"esModuleInterop":true,"baseUrl":"."}}
EOF
  fi

  TEST_OUTPUT=$(cd "$PROJECT_DIR" && npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts 2>&1 | tail -10 || true)
  TEST_PASS=$(echo "$TEST_OUTPUT" | grep -c "✅ 통과" || true)
  TEST_FAIL=$(echo "$TEST_OUTPUT" | grep -c "❌ 실패" || true)

  if [ "$TEST_FAIL" -gt 0 ]; then
    HAS_ERROR=true
    FEEDBACK+="❌ 사주 엔진 테스트 ${TEST_FAIL}개 실패!\n${TEST_OUTPUT}\n"
  else
    FEEDBACK+="✅ 사주 엔진 테스트 ${TEST_PASS}/35 통과\n"
  fi
fi

# ── 3. console.log 감지 경고 ─────────────────────────────────
if echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""' | grep -q 'console\.log'; then
  FEEDBACK+="⚠️  console.log 감지 — 프로덕션 코드에서는 console.error/warn 사용 권장\n"
fi

# ── 4. 오류 있을 때 블록 (Claude에 피드백 제공) ──────────────────
if [ "$HAS_ERROR" = true ]; then
  printf '%s' "$FEEDBACK" | jq -Rs '{
    decision: "block",
    reason: "자동 교정 루프: 오류가 감지되었습니다.",
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: .
    }
  }'
  exit 0
fi

# 성공 시 피드백만 제공
printf '%s' "$FEEDBACK" | jq -Rs '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: .
  }
}'

exit 0
