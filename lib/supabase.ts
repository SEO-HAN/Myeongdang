/**
 * Supabase 클라이언트 설정
 *
 * Next.js App Router 패턴:
 *  - createBrowserClient  → 'use client' 컴포넌트
 *  - createServerClient   → Server Component / Route Handler / Middleware
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ─────────────────────────────────────────────
// 클라이언트 컴포넌트용 (브라우저)
// ─────────────────────────────────────────────
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─────────────────────────────────────────────
// 서버 컴포넌트 / Route Handler용
// 사용법: import { createServerClient } from '@supabase/ssr'
// cookies() 를 주입해야 하므로 각 Route에서 직접 호출
// ─────────────────────────────────────────────
export { createServerClient } from '@supabase/ssr'

// ─────────────────────────────────────────────
// 편의 타입
// ─────────────────────────────────────────────
export type SupabaseClient = ReturnType<typeof createClient>
