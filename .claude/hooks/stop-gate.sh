#!/bin/bash
# ============================================================
# 명당지도 — Stop 훅 (완료 전 CI 게이트)
# 역할: Claude가 응답 완료 전 품질 게이트 실행
#        - TypeScript 오류 있으면 블록
#        - 사주 엔진 수정 후 테스트 미실행이면 경고
#        - TODO/FIXME 항목 요약 제공
# 이벤트: Stop
# ============================================================

set -uo pipefail

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
INPUT=$(cat)

# node_modules 없으면 스킵
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  exit 0
fi

CONTEXT=""
SHOULD_BLOCK=false

# ── 1. TypeScript 오류 체크 ───────────────────────────────────
TS_ERRORS=$(cd "$PROJECT_DIR" && npx tsc --noEmit 2>&1 | grep -c "error TS" || true)

if [ "$TS_ERRORS" -gt 0 ]; then
  SHOULD_BLOCK=true
  TS_DETAIL=$(cd "$PROJECT_DIR" && npx tsc --noEmit 2>&1 | grep "error TS" | head -5)
  CONTEXT+="🔴 TypeScript 오류 ${TS_ERRORS}개가 남아 있습니다:\n${TS_DETAIL}\n\n"
  CONTEXT+="→ 오류를 모두 수정한 후 완료해 주세요.\n"
fi

# ── 2. TODO/FIXME 항목 수집 ──────────────────────────────────
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  2>/dev/null | wc -l | tr -d ' ')

if [ "$TODO_COUNT" -gt 0 ]; then
  CONTEXT+="📋 미완료 TODO/FIXME: ${TODO_COUNT}개\n"
  grep -r "TODO\|FIXME" "$PROJECT_DIR" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.next \
    -l 2>/dev/null | head -5 | while read -r f; do
    CONTEXT+="  - ${f#$PROJECT_DIR/}\n"
  done
  CONTEXT+="\n"
fi

# ── 3. 사주 엔진 수정 후 테스트 미실행 경고 ───────────────────
# 최근 수정된 엔진 파일 체크
ENGINE_RECENTLY_MODIFIED=false
for f in "$PROJECT_DIR/lib/saju/engine.ts" "$PROJECT_DIR/lib/saju/types.ts"; do
  if [ -f "$f" ] && [ "$(find "$f" -newer "$PROJECT_DIR/CLAUDE.md" 2>/dev/null)" != "" ]; then
    ENGINE_RECENTLY_MODIFIED=true
  fi
done

if [ "$ENGINE_RECENTLY_MODIFIED" = true ]; then
  CONTEXT+="⚡ 사주 엔진 파일이 수정되었습니다. 다음 명령으로 테스트를 실행하세요:\n"
  CONTEXT+="   npx ts-node -P /tmp/tsconfig_test.json lib/saju/engine.test.ts\n\n"
fi

# ── 4. UX 일관성 체크 ────────────────────────────────────────
# Client Component에 'use client' 누락 여부 검사
MISSING_USE_CLIENT=()
while IFS= read -r -d '' file; do
  # useState, useEffect, useRef, useCallback, useMemo 사용하면 'use client' 필요
  if grep -qE "useState|useEffect|useRef|useCallback|useMemo|useRouter|usePathname|useSearchParams" "$file" 2>/dev/null; then
    if ! head -3 "$file" | grep -q "'use client'"; then
      MISSING_USE_CLIENT+=("${file#$PROJECT_DIR/}")
    fi
  fi
done < <(find "$PROJECT_DIR/components" "$PROJECT_DIR/app" -name "*.tsx" \
  -not -path "*/node_modules/*" -not -path "*/.next/*" \
  -not -name "layout.tsx" -not -name "error.tsx" \
  -print0 2>/dev/null)

if [ ${#MISSING_USE_CLIENT[@]} -gt 0 ]; then
  SHOULD_BLOCK=true
  CONTEXT+="🔴 'use client' 누락된 클라이언트 컴포넌트:\n"
  for f in "${MISSING_USE_CLIENT[@]}"; do
    CONTEXT+="  - $f\n"
  done
  CONTEXT+="→ 파일 첫 줄에 'use client'를 추가하세요.\n\n"
fi

# ── 5. 모바일 터치 타겟 크기 경고 (44px 미만 버튼 감지) ─────────
# h-8(32px) 이하 단독 버튼 사용 경고 (w-8/h-8 = 32px)
SMALL_TOUCH_COUNT=$(grep -r "className=\".*\bh-8\b\|className=\".*\bh-6\b\|className=\".*\bh-7\b" \
  "$PROJECT_DIR/components" "$PROJECT_DIR/app" \
  --include="*.tsx" -l 2>/dev/null | wc -l | tr -d ' ')

if [ "$SMALL_TOUCH_COUNT" -gt 0 ]; then
  CONTEXT+="📱 터치 타겟 크기 경고: h-8 이하 버튼 ${SMALL_TOUCH_COUNT}개 파일에서 발견\n"
  CONTEXT+="   모바일 UX 기준 44px(h-11) 이상 권장 (클릭 영역 확인 필요)\n\n"
fi

# ── 블록 또는 컨텍스트 제공 ──────────────────────────────────
if [ "$SHOULD_BLOCK" = true ]; then
  printf '%s' "$CONTEXT" | jq -Rs '{
    decision: "block",
    reason: "CI 게이트: TypeScript 오류가 해결되지 않았습니다.",
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: .
    }
  }'
  exit 0
fi

if [ -n "$CONTEXT" ]; then
  printf '%s' "$CONTEXT" | jq -Rs '{
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: .
    }
  }'
fi

exit 0
