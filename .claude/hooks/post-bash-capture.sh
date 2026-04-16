#!/bin/bash
# ============================================================
# 명당지도 — PostToolUse(Bash) 훅
# 역할: Bash 실행 결과 캡처 & 빌드/테스트 실패 피드백
# 이벤트: PostToolUse, matcher: Bash
# ============================================================

set -uo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
TOOL_RESPONSE=$(echo "$INPUT" | jq -r '.tool_response // {}')

# ── npm run build 결과 분석 ───────────────────────────────────
if echo "$COMMAND" | grep -qE 'npm\s+run\s+build|next\s+build'; then
  STDOUT=$(echo "$TOOL_RESPONSE" | jq -r '.stdout // ""')
  STDERR=$(echo "$TOOL_RESPONSE" | jq -r '.stderr // ""')

  if echo "$STDOUT $STDERR" | grep -qiE '(Build failed|Failed to compile|Error:)'; then
    ERROR_LINES=$(echo "$STDOUT $STDERR" | grep -iE '(error|failed)' | head -10)
    printf '%s' "🔴 빌드 실패!\n${ERROR_LINES}\n\n→ 오류를 수정 후 다시 빌드하세요." | jq -Rs '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: .
      }
    }'
    exit 0
  fi

  if echo "$STDOUT" | grep -q "Compiled successfully"; then
    SIZE_INFO=$(echo "$STDOUT" | grep -E "Route|Size" | head -8 || true)
    printf '%s' "✅ 빌드 성공!\n${SIZE_INFO}" | jq -Rs '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: .
      }
    }'
  fi
fi

# ── 사주 엔진 테스트 결과 분석 ───────────────────────────────
if echo "$COMMAND" | grep -q "engine.test.ts"; then
  STDOUT=$(echo "$TOOL_RESPONSE" | jq -r '.stdout // ""')

  PASS=$(echo "$STDOUT" | grep -oE '통과: [0-9]+' | grep -oE '[0-9]+' || echo "0")
  FAIL=$(echo "$STDOUT" | grep -oE '실패: [0-9]+' | grep -oE '[0-9]+' || echo "0")

  if [ "$FAIL" != "0" ] && [ -n "$FAIL" ]; then
    FAIL_DETAIL=$(echo "$STDOUT" | grep "❌" | head -10)
    printf '%s' "❌ 사주 엔진 테스트 ${FAIL}개 실패:\n${FAIL_DETAIL}" | jq -Rs '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: .
      }
    }'
  elif echo "$STDOUT" | grep -q "🎉 모든 테스트 통과"; then
    printf '%s' "✅ 사주 엔진 35/35 테스트 통과 — 엔진 변경사항 검증 완료" | jq -Rs '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: .
      }
    }'
  fi
fi

# ── TypeScript 타입 체크 결과 ────────────────────────────────
if echo "$COMMAND" | grep -qE 'tsc\s+--noEmit|type-check'; then
  STDOUT=$(echo "$TOOL_RESPONSE" | jq -r '.stdout // ""')
  STDERR=$(echo "$TOOL_RESPONSE" | jq -r '.stderr // ""')

  TS_ERRORS=$(echo "$STDOUT $STDERR" | grep -c "error TS" || true)
  if [ "$TS_ERRORS" -gt 0 ]; then
    ERRORS=$(echo "$STDOUT $STDERR" | grep "error TS" | head -8)
    printf '%s' "🔴 TypeScript 오류 ${TS_ERRORS}개:\n${ERRORS}" | jq -Rs '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: .
      }
    }'
  fi
fi

exit 0
