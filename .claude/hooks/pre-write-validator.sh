#!/bin/bash
# ============================================================
# 명당지도 — PreToolUse(Write/Edit/Create) 훅
# 역할: 파일 쓰기 전 경로 규칙 + 보안 패턴 검증
# 이벤트: PreToolUse, matcher: Write|Edit|MultiEdit
# ============================================================

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')

# ── 파일 경로 규칙 검증 ───────────────────────────────────────

# app/api/ 에는 route.ts만 허용
if echo "$FILE_PATH" | grep -qE 'app/api/.*\.(tsx|js|jsx)$'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "app/api/ 디렉토리에는 route.ts 파일만 허용됩니다 (Next.js App Router 규칙)"
    }
  }'
  exit 0
fi

# components/ 에는 .tsx만 허용
if echo "$FILE_PATH" | grep -qE 'components/.*\.ts$'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "components/ 디렉토리에는 .tsx 파일만 허용됩니다"
    }
  }'
  exit 0
fi

# .env.local 직접 수정 방지
if echo "$FILE_PATH" | grep -qE '\.env(\.local|\.production)?$'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "환경변수 파일을 수정하려 합니다. 기존 키가 덮어써질 수 있습니다. 계속하시겠습니까?"
    }
  }'
  exit 0
fi

# ── 콘텐츠 보안 패턴 검증 ────────────────────────────────────

# 시크릿 키 패턴 감지
if echo "$CONTENT" | grep -qE '(SUPABASE_SERVICE_ROLE_KEY|sk-ant-|eyJhbGciOiJIUzI1NiJ9\.|password\s*=\s*["\x27][^"\x27]{8,})'; then
  # NEXT_PUBLIC_ 변수가 아닌 경우에만 차단
  if ! echo "$CONTENT" | grep -qE 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "시크릿 키 또는 비밀번호가 코드에 하드코딩되었습니다. 환경변수를 사용하세요."
      }
    }'
    exit 0
  fi
fi

# Server Component에서 'use client' 없이 useState 사용 검사
if echo "$FILE_PATH" | grep -qE 'app/(page|layout|not-found|error)\.tsx$'; then
  if echo "$CONTENT" | grep -qE 'useState|useEffect|useRef' && ! echo "$CONTENT" | grep -q "'use client'"; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Server Component (page.tsx/layout.tsx)에서 React Hook 사용이 감지됩니다. '\''use client'\'' 선언이 필요하거나 로직을 Client Component로 분리하세요."
      }
    }'
    exit 0
  fi
fi

# NEXT_PUBLIC_ 없는 환경변수를 클라이언트 컴포넌트에서 직접 사용
if echo "$CONTENT" | grep -q "'use client'" && echo "$CONTENT" | grep -qE 'process\.env\.(SUPABASE_SERVICE_ROLE_KEY|KAKAO_CLIENT_SECRET)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "서버 전용 환경변수(SUPABASE_SERVICE_ROLE_KEY 등)를 Client Component에서 사용하고 있습니다. 서버 API Route를 통해 접근하세요."
    }
  }'
  exit 0
fi

# ── 통과 ────────────────────────────────────────────────────
exit 0
