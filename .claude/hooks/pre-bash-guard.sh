#!/bin/bash
# ============================================================
# 명당지도 — PreToolUse(Bash) 훅
# 역할: 위험한 Bash 명령어 차단 + 안전한 명령어 자동 승인
# 이벤트: PreToolUse, matcher: Bash
# ============================================================

set -uo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# ── 위험 패턴 차단 ────────────────────────────────────────────

# 1. rm -rf (node_modules 또는 .next는 허용)
if echo "$COMMAND" | grep -qE 'rm\s+-[rRf]*f[rRf]*\s+'; then
  # node_modules, .next, out, build 삭제는 허용
  if ! echo "$COMMAND" | grep -qE 'rm.*\s+(node_modules|\.next|/out|/build)\s*$'; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "rm -rf는 node_modules/.next 외 경로에서 위험합니다. 대신 구체적인 파일/디렉토리를 명시하세요."
      }
    }'
    exit 0
  fi
fi

# 2. git 파괴적 작업
if echo "$COMMAND" | grep -qE 'git\s+(reset\s+--hard|push\s+--force|push\s+-f\b|checkout\s+\.|clean\s+-f|branch\s+-[Dd]\s+main)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "파괴적 git 작업이 감지되었습니다. 명시적으로 필요한 경우 사용자에게 직접 실행을 요청하세요."
    }
  }'
  exit 0
fi

# 3. 위험한 파이프라인 (curl | bash 등)
if echo "$COMMAND" | grep -qE 'curl.*\|\s*(bash|sh|zsh)|wget.*\|\s*(bash|sh|zsh)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "curl|bash 패턴은 보안 위험입니다. 스크립트를 먼저 다운로드하여 내용을 확인 후 실행하세요."
    }
  }'
  exit 0
fi

# 4. 환경변수 파일 덮어쓰기 방지
if echo "$COMMAND" | grep -qE '>\s*\.env(\.local|\.production)?$'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ".env 파일 덮어쓰기가 감지되었습니다. 기존 환경변수가 손실될 수 있습니다."
    }
  }'
  exit 0
fi

# 5. Supabase 위험 SQL (WHERE 없는 DELETE/DROP)
if echo "$COMMAND" | grep -qiE '(DROP\s+TABLE|DELETE\s+FROM\s+\w+\s*;|TRUNCATE\s+TABLE)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "데이터 삭제/초기화 SQL이 감지되었습니다. 실수로 시드 데이터가 삭제될 수 있습니다. 계속하시겠습니까?"
    }
  }'
  exit 0
fi

# ── 안전한 패턴 자동 승인 ─────────────────────────────────────

# 개발 명령어 자동 승인
if echo "$COMMAND" | grep -qE '^(npm|npx|node|ts-node|next|git (status|log|diff|add|commit|stash|pull)|ls|cat|find|grep|echo|mkdir|cp|mv|chmod)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "안전한 개발 명령어 자동 승인"
    }
  }'
  exit 0
fi

# 기본: 판단을 Claude에게 위임
exit 0
